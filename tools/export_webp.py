#!/usr/bin/env python3
"""Export web-optimised WebP derivatives from public/assets/gallery/ and sync MANIFEST.json.

Usage:
  python3 tools/export_webp.py                 # Export canonical gallery assets to public/assets/web/
  python3 tools/export_webp.py --dry-run       # Preview planned exports without writing files
  python3 tools/export_webp.py --only 'gold*'  # Export only matching gallery filenames
  python3 tools/export_webp.py --all           # Include duplicate dark-hero size variants
  python3 tools/export_webp.py --gold-lossless # Encode Route 03 gold filaments as lossless WebP
"""
from __future__ import annotations

import argparse
import fnmatch
import json
import re
import sys
from datetime import date
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError as exc:
    raise SystemExit("Pillow is required. Install it with: python3 -m pip install pillow") from exc

# Allow large 300 DPI print masters (e.g. 10,032 x 10,032 px ~ 100.6 MP) without DecompressionBombError.
Image.MAX_IMAGE_PIXELS = 250_000_000

ROOT = Path(__file__).resolve().parents[1]
ASSETS_DIR = ROOT / "public" / "assets"
MANIFEST_PATH = ASSETS_DIR / "MANIFEST.json"
OUT_DIR = ASSETS_DIR / "web"

# Skip redundant dark-hero size exports unless --all is passed.
SKIP_BY_DEFAULT = {
    "gallery/signature-diagonal-dark-master-v02.png",
    "gallery/signature-diagonal-dark-master-v01.jpg",
    "gallery/signature-diagonal-dark-source-v01.png",
    "gallery/signature-diagonal-dark-source-v02.png",
    "gallery/signature-diagonal-dark-source-v03.png",
}


def web_filename(gallery_rel_path: str) -> str:
    name = Path(gallery_rel_path).stem
    name = re.sub(r"-(master|source)(?=-v\d+$)", "-web", name)
    if "-web-" not in name:
        name = f"{name}-web"
    return f"{name}.webp"


def encoding_profile(item: dict, gold_lossless: bool) -> dict:
    route = item.get("route", "")
    composition = item.get("composition", "")
    has_alpha = bool(item.get("hasAlpha"))

    if route == "gold":
        return {
            "max_edge": 1800,
            "mode": "RGBA" if has_alpha else "RGB",
            "save_kwargs": (
                {"lossless": True, "method": 6, "exact": True}
                if gold_lossless
                else {"quality": 92, "method": 6, "exact": True}
            ),
        }

    if not has_alpha:
        return {
            "max_edge": 2200,
            "mode": "RGB",
            "save_kwargs": {"quality": 84, "method": 6},
        }

    max_edge = 1000 if composition == "corner" else 1600
    return {
        "max_edge": max_edge,
        "mode": "RGBA",
        "save_kwargs": {"quality": 86, "method": 6},
    }


def resolve_source(item: dict) -> Path | None:
    primary = ASSETS_DIR / item["path"]
    if primary.is_file():
        return primary
    legacy = item.get("legacyFilename")
    if legacy:
        fallback = ASSETS_DIR / "gallery" / legacy
        if fallback.is_file():
            return fallback
    return None


def export_image(src: Path, dst: Path, profile: dict) -> tuple[int, int, int]:
    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode != profile["mode"]:
            img = img.convert(profile["mode"])
        max_edge = profile["max_edge"]
        if max(img.size) > max_edge:
            img.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
        dst.parent.mkdir(parents=True, exist_ok=True)
        img.save(dst, format="WEBP", **profile["save_kwargs"])
        width, height = img.size
    return width, height, dst.stat().st_size


def upsert_manifest_asset(manifest: dict, entry: dict) -> None:
    assets = manifest.setdefault("assets", [])
    for idx, existing in enumerate(assets):
        if existing.get("path") == entry["path"]:
            assets[idx] = entry
            return
    assets.append(entry)


def format_bytes(size: int) -> str:
    return f"{size / 1024:.1f} KB" if size < 1_048_576 else f"{size / 1_048_576:.2f} MB"


def main() -> int:
    parser = argparse.ArgumentParser(description="Export WebP derivatives from gallery sources.")
    parser.add_argument("--only", help="Glob pattern matched against gallery filename (e.g. 'quiet*').")
    parser.add_argument("--all", action="store_true", help="Include redundant dark-hero size variants.")
    parser.add_argument("--gold-lossless", action="store_true", help="Use lossless WebP for Route 03 gold filaments.")
    parser.add_argument("--dry-run", action="store_true", help="Print planned exports without writing files.")
    parser.add_argument("--no-manifest", action="store_true", help="Do not update public/assets/MANIFEST.json.")
    args = parser.parse_args()

    if not MANIFEST_PATH.is_file():
        raise SystemExit(f"Manifest not found: {MANIFEST_PATH}")

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    items = manifest.get("gallery", {}).get("items", [])
    exported = 0

    for item in items:
        rel_path = item["path"]
        if not args.all and not args.only and rel_path in SKIP_BY_DEFAULT:
            continue
        if args.only and not fnmatch.fnmatch(Path(rel_path).name, args.only):
            continue

        src = resolve_source(item)
        if src is None:
            print(f"[skip] Missing source for {rel_path}", file=sys.stderr)
            continue

        out_name = web_filename(rel_path)
        dst = OUT_DIR / out_name
        profile = encoding_profile(item, args.gold_lossless)

        if args.dry_run:
            print(f"[dry-run] {src.name} -> web/{out_name} (max {profile['max_edge']}px, {profile['save_kwargs']})")
            exported += 1
            continue

        width, height, out_bytes = export_image(src, dst, profile)
        src_bytes = src.stat().st_size
        savings = (1 - out_bytes / src_bytes) * 100 if src_bytes else 0
        print(
            f"[ok] {src.name} -> web/{out_name} "
            f"({width}x{height}, {format_bytes(src_bytes)} -> {format_bytes(out_bytes)}, -{savings:.0f}%)"
        )
        exported += 1

        if not args.no_manifest:
            web_rel = f"web/{out_name}"
            item["preferredAlternative"] = web_rel
            upsert_manifest_asset(
                manifest,
                {
                    "path": web_rel,
                    "category": "artwork-web",
                    "status": "active",
                    "format": "WEBP",
                    "bytes": out_bytes,
                    "dimensions": f"{width}x{height}",
                    "webReady": True,
                    "route": item.get("route"),
                    "composition": item.get("composition"),
                    "surface": item.get("surface"),
                    "hasAlpha": item.get("hasAlpha"),
                    "sourceAsset": rel_path,
                    "visualDescription": item.get("visualDescription"),
                    "recommendedUse": item.get("recommendedUse"),
                },
            )

    if exported and not args.dry_run and not args.no_manifest:
        manifest["updated"] = date.today().isoformat()
        MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Updated {MANIFEST_PATH.relative_to(ROOT)} with {exported} WebP asset(s).")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
