# Public Assets Guide (Human & AI Coding Agents)

Read `MANIFEST.json` in this directory before selecting, modifying, or referencing any asset in `public/assets/`.

This repository implements the **Innovate Connects** evening-luxe visual system (`docs/brand-guidelines.md`). Assets here fall into two groups:

1. **Active web assets** (`hero-background.webp`, `art/`, `css/`, `icons/`, `js/`, `textures/`) — ready for use on pages where appropriate.
2. **Artwork review library** (`gallery/`) — unreviewed or in-progress raster artwork and high-resolution print/poster masters inspected via `public/assets-gallery.html`.

---

## Rules for AI Coding Agents

- **Inspect `MANIFEST.json` first.** Never guess an image's subject, transparency, background, or approval status from its filename alone.
- **Prefer WebP for web delivery.** Use `.webp` derivatives over multi-megabyte `.png` or `.svg` sources in HTML/CSS unless a vector asset is explicitly required.
- **Never embed `gallery/` print masters directly.** Files in `gallery/` include 10–50 MB PNG/JPG masters. Only use a gallery asset on a live page once its `status` is `"approved"` and a web-optimised `.webp` derivative has been created outside `gallery/`.
- **Do not treat `brand/connectivity-mark.svg` as the active brand logo.** It is an earlier gold linked-node concept mark. The canonical brand mark in `docs/brand-guidelines.md` is **Route 5: Woven IC** (flat master SVG for small/header use; rich woven render for hero/print).
- **Respect the build-time art swap.** `tools/build_pages.py` (`promote_concept_art`) copies `docs/assets/art/report-flow.svg` and `docs/assets/art/workshop-flow.svg` into `_site/concept-two/assets/art/*-concept-one.svg` and rewrites those two `<img>` references in `public/index.html`. Do not break those exact `src` strings unless updating `tools/build_pages.py` at the same time.
- **Use relative paths.** `tools/build_pages.py` validates all local HTML/CSS references and rewrites `/assets/` paths during build; prefer relative `assets/...` paths in `public/` pages.

---

## Directory Map

| Folder / File | Purpose | Agent guidance |
| :--- | :--- | :--- |
| `hero-background.webp` | Primary dark hero background image (137 KB) | Use for web hero backgrounds. Keep `hero-background.png` (2.8 MB) as source only. |
| `art/` | Section flow artwork (`hero-flow`, `report-flow`, `workshop-flow`, `footer-flow`) | Prefer `.webp` for layout rendering (`31–128 KB`). `.svg` files (`227 KB–1 MB`) are generated vector sources from `tools/generate-flow.mjs`. |
| `brand/` | Brand marks (`connectivity-mark.svg`) | Legacy gold node-and-arc mark. Do not use as the canonical Woven IC logo. |
| `icons/` | `signal-icons.svg` (560 × 140 sprite) | Four gold line icons: assess, strategise, enable, realise. |
| `textures/` | `grain-overlay.svg` | Tileable subtle surface grain for dark/paper sections. |
| `css/` | Modular stylesheets (`brand-tokens.css`, `site.css`, `site-header.css`, `hero.css`, `luxury-surface.css`, `art-direction.css`, `report-cover.css`) | Load `brand-tokens.css` first; keep colour and font tokens aligned with `docs/brand-guidelines.md`. |
| `js/` | `site-header.js` | Mobile navigation toggle and Escape-key dismissal. |
| `gallery/` | Artwork review drop-folder (indexed automatically by `tools/build_pages.py`) | Currently contains 21 unlabelled raster files (`status: "unreviewed"` in `MANIFEST.json`). Do not select for production until visually reviewed and labelled. |

---

## Naming Convention for New & Renamed Assets

Use lowercase kebab-case with no spaces so files are clean in URLs, shell scripts, and agent diffs:

```text
<route>-<composition>-<surface>-<tier>-v<NN>.<ext>
```

- **route:** `signature` (Route 01: Signature ribbons), `quiet` (Route 02: Quiet ribbons), `gold` (Route 03: Gold filaments and flares), `brand` (logos/marks), `ui` (icons/textures)
- **composition:** `diagonal`, `horizontal`, `vertical`, `open-arc`, `corner`, `convergence`, `full`
- **surface:** `dark`, `light`, `alpha` (verified transparent background)
- **tier:** `web` (optimised WebP/PNG for browser), `source` (native generator output), `master` (finished 300 DPI print master)
- **revision:** `v01`, `v02`, etc.

Examples:
- `signature-diagonal-alpha-master-v01.png`
- `signature-diagonal-dark-web-v01.webp`
- `quiet-corner-alpha-source-v01.png`
- `gold-horizontal-light-web-v02.webp`

When adding, renaming, or approving any asset, update `MANIFEST.json` in the same commit.
