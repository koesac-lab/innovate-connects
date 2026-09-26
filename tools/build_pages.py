#!/usr/bin/env python3
"""Assemble and check the GitHub Pages site without changing source concepts."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import shutil

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


def promote_concept_art():
    art = SITE / "concept-two" / "assets" / "art"
    for name in ("report-flow", "workshop-flow"):
        source = ROOT / "docs" / "assets" / "art" / f"{name}.svg"
        shutil.copy2(source, art / f"{name}-concept-one.svg")
    index = SITE / "concept-two" / "index.html"
    html = index.read_text(encoding="utf-8")
    swaps = (
        ('src="assets/art/report-flow.webp"', 'src="assets/art/report-flow-concept-one.svg"'),
        ('class="art-object art-object--workshop" src="assets/art/workshop-flow.webp"', 'class="art-object art-object--workshop" src="assets/art/workshop-flow-concept-one.svg"'),
    )
    for before, after in swaps:
        if html.count(before) != 1:
            raise SystemExit(f"Expected exactly one concept-two image reference: {before}")
        html = html.replace(before, after, 1)
    index.write_text(html, encoding="utf-8")


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
    promote_concept_art()
    polish_brand_direction()
    for page in SITE.rglob("*.html"):
        html = page.read_text(encoding="utf-8")
        html = re.sub(r"<base\b[^>]*href\s*=\s*['\"]/innovate-connects/['\"][^>]*>", "", html, flags=re.I)
        html = re.sub(r"(?<=[\"'(])/assets/", "assets/", html)
        html = html.replace('href="/"', 'href="./"').replace("href='/'", "href='./'")
        page.write_text(html, encoding="utf-8")
    for stylesheet in SITE.rglob("*.css"):
        css = stylesheet.read_text(encoding="utf-8")
        css = re.sub(r"(?<=[\"'(])/assets/", "../", css)
        stylesheet.write_text(css, encoding="utf-8")
    for name in ("index.html", "concept-two/index.html", "concept-two/brand-direction.html", "concept-two/logo-ideas.html", "concept-two/art-lab.html"):
        if not (SITE / name).is_file():
            raise SystemExit(f"Missing published page: {name}")
    check_site()


if __name__ == "__main__":
    build()
