#!/usr/bin/env python3
"""Assemble and check the GitHub Pages site without changing source concepts."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit
import json
import math
import re
import shutil
import struct

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"


def local_path(page, reference):
    reference = reference.strip()
    if not reference or reference.startswith(("#", "//")):
        return None
    parts = urlsplit(reference)
    if parts.scheme or parts.netloc or not parts.path:
        return None
    if parts.path.startswith("/"):
        raise ValueError(f"Root-relative URL in {page.relative_to(SITE)}: {reference}")
    target = (page.parent / unquote(parts.path)).resolve()
    if not target.is_relative_to(SITE.resolve()):
        raise ValueError(f"URL escapes published site: {reference}")
    if target.is_dir():
        target /= "index.html"
    return target


class ResourceLinks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.references = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag in {"img", "script", "source", "video", "audio"} and values.get("src"):
            self.references.append(values["src"])
        if tag == "link" and values.get("href") and any(
            item in (values.get("rel") or "").split() for item in ("stylesheet", "icon", "preload")
        ):
            self.references.append(values["href"])
        if tag == "a" and values.get("href"):
            self.references.append(values["href"])
        if values.get("srcset"):
            self.references.extend(item.strip().split()[0] for item in values["srcset"].split(","))


def check_site():
    missing = []
    for page in SITE.rglob("*.html"):
        parser = ResourceLinks()
        parser.feed(page.read_text(encoding="utf-8"))
        for reference in parser.references:
            try:
                target = local_path(page, reference)
                if target is not None and not target.is_file():
                    missing.append(f"{page.relative_to(SITE)}: {reference}")
            except ValueError as exc:
                missing.append(str(exc))
    for stylesheet in SITE.rglob("*.css"):
        css = stylesheet.read_text(encoding="utf-8")
        for match in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", css, flags=re.I | re.S):
            reference = match.group(2).strip()
            try:
                target = local_path(stylesheet, reference)
                if target is not None and not target.is_file():
                    missing.append(f"{stylesheet.relative_to(SITE)}: {reference}")
            except ValueError as exc:
                missing.append(str(exc))
    if missing:
        raise SystemExit("Unresolved published references:\n" + "\n".join(sorted(set(missing))))
    print("Published HTML and CSS local references resolve.")


def exif_density(data):
    """Read TIFF IFD0 density and orientation from a bounded EXIF segment."""
    tiff = data[6:]
    endian = {b"II": "<", b"MM": ">"}.get(tiff[:2])
    if not endian:
        return None, 1
    def read(fmt, offset):
        return struct.unpack_from(endian + fmt, tiff, offset)
    if read("H", 2)[0] != 42:
        return None, 1
    offset = read("I", 4)[0]
    values = {}
    for i in range(min(read("H", offset)[0], 4096)):
        p = offset + 2 + 12 * i
        tag, kind, count = read("HHI", p)
        if count != 1:
            continue
        if kind == 3:
            values[tag] = read("H", p + 8)[0]
        elif kind == 5:
            numerator, denominator = read("II", read("I", p + 8)[0])
            if denominator:
                values[tag] = numerator / denominator
    unit = values.get(296, 2)
    factor = {2: 1, 3: 2.54}.get(unit)
    density = None
    if factor and values.get(282, 0) > 0 and values.get(283, 0) > 0:
        density = [values[282] * factor, values[283] * factor]
    return density, values.get(274, 1)


def image_metadata(path):
    result = {}
    with path.open("rb") as stream:
        signature = stream.read(8)
        if signature == b"\x89PNG\r\n\x1a\n":
            while True:
                header = stream.read(8)
                if len(header) != 8:
                    break
                length, kind = struct.unpack(">I4s", header)
                if kind in (b"IDAT", b"IEND"):
                    break
                if kind == b"IHDR" and length == 13:
                    data = stream.read(length)
                    result["width"], result["height"] = struct.unpack(">II", data[:8])
                elif kind == b"pHYs" and length == 9:
                    x, y, unit = struct.unpack(">IIB", stream.read(9))
                    if unit == 1 and x and y:
                        result.update(dpi=[x * .0254, y * .0254], dpiSource="PNG pHYs")
                else:
                    stream.seek(length, 1)
                stream.seek(4, 1)
        elif signature[:2] == b"\xff\xd8":
            stream.seek(2)
            orientation = 1
            exif_dpi = None
            while True:
                marker = stream.read(1)
                if not marker:
                    break
                if marker != b"\xff":
                    continue
                marker = stream.read(1)
                while marker == b"\xff":
                    marker = stream.read(1)
                if marker in (b"", b"\xda", b"\xd9"):
                    break
                if marker in (b"\x00", b"\x01", b"\xd8") or 0xd0 <= marker[0] <= 0xd7:
                    continue
                size = struct.unpack(">H", stream.read(2))[0] - 2
                if size < 0:
                    break
                data = stream.read(size)
                if marker == b"\xe0" and data.startswith(b"JFIF\x00") and len(data) >= 12:
                    unit, x, y = struct.unpack(">BHH", data[7:12])
                    if unit in (1, 2) and x and y:
                        factor = 2.54 if unit == 2 else 1
                        result.update(dpi=[x * factor, y * factor], dpiSource="JPEG JFIF")
                if marker == b"\xe1" and data.startswith(b"Exif\x00\x00"):
                    try:
                        density, rotation = exif_density(data)
                        if density:
                            exif_dpi = density
                        orientation = rotation
                    except (struct.error, IndexError, ValueError):
                        pass
                if marker[0] in (0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf) and len(data) >= 5:
                    result["height"], result["width"] = struct.unpack(">HH", data[1:5])
            if exif_dpi:
                result.update(dpi=exif_dpi, dpiSource="JPEG EXIF")
            if orientation in (5, 6, 7, 8):
                if "width" in result:
                    result["width"], result["height"] = result["height"], result["width"]
                if "dpi" in result:
                    result["dpi"].reverse()
    if "dpi" in result and not all(math.isfinite(v) and v > 0 for v in result["dpi"]):
        result.pop("dpi", None)
        result.pop("dpiSource", None)
    return result


def index_gallery():
    folder = SITE / "concept-two" / "assets" / "gallery"
    folder.mkdir(parents=True, exist_ok=True)
    assets = []
    for path in sorted(folder.rglob("*"), key=lambda p: p.as_posix().casefold()):
        if not path.is_file() or path.is_symlink() or path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
            continue
        relative = path.relative_to(folder)
        if any(part.startswith(".") for part in relative.parts):
            continue
        asset = {"name": relative.as_posix(), "url": "assets/gallery/" + quote(relative.as_posix(), safe="/"), "bytes": path.stat().st_size, "format": path.suffix[1:].upper()}
        try:
            asset.update(image_metadata(path))
        except (OSError, struct.error, ValueError, IndexError) as exc:
            print(f"Gallery metadata unavailable for {relative}: {exc}")
        assets.append(asset)
    (folder / "index.json").write_text(json.dumps(assets, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Indexed {len(assets)} gallery assets.")


def polish_brand_direction():
    page = SITE / "concept-two" / "brand-direction.html"
    html = page.read_text(encoding="utf-8")
    if html.count("</head>") != 1:
        raise SystemExit("Cannot locate Brand Direction head for style fix")
    styles = """<style>
    /* Keep the dark website mock-up legible within the light Applications section. */
    .website-mock { color: var(--paper); }
    .website-mock .eyebrow { color: var(--gold-light); }
    /* Reserve real space for the Perspective 1 title and its footer. */
    .report-cover { display: flex; flex-direction: column; min-height: 350px; }
    .report-cover h3 { margin: auto 0 22px; }
    .report-cover footer { position: static; bottom: auto; line-height: 1.45; }
    @media (max-width: 760px) { .report-cover { min-height: 370px; } }
  </style>
"""
    page.write_text(html.replace("</head>", styles + "</head>", 1), encoding="utf-8")


def build():
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir()
    shutil.copytree(ROOT / "public", SITE / "concept-two")
    shutil.copy2(ROOT / "docs" / "links.html", SITE / "index.html")
    (SITE / ".nojekyll").touch()
    (SITE / "showcase.html").write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=concept-two/"><title>Innovate Connects</title><a href="concept-two/">Visit the current concept</a></html>\n', encoding="utf-8")
    polish_brand_direction()
    index_gallery()
    for page in SITE.rglob("*.html"):
        html = page.read_text(encoding="utf-8")
        html = re.sub(r"<base\b[^>]*href\s*=\s*['\"]/innovate-connects/['\"][^>]*>", "", html, flags=re.I)
        html = re.sub(r"(?<=[\"'(\s])/assets/", "assets/", html)
        html = html.replace('href="/"', 'href="./"').replace("href='/'", "href='./'")
        page.write_text(html, encoding="utf-8")
    for stylesheet in SITE.rglob("*.css"):
        css = stylesheet.read_text(encoding="utf-8")
        css = re.sub(r"(?<=[\"'(\s])/assets/", "../", css)
        stylesheet.write_text(css, encoding="utf-8")
    for name in ("index.html", "concept-two/index.html", "concept-two/brand-direction.html", "concept-two/logo-ideas.html", "concept-two/art-lab.html", "concept-two/assets-gallery.html"):
        if not (SITE / name).is_file():
            raise SystemExit(f"Missing published page: {name}")
    check_site()


if __name__ == "__main__":
    build()
