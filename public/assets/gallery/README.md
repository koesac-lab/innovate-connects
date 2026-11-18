# Artwork review assets

Drop PNG, JPG/JPEG, WebP or GIF files into this folder. Subfolders are supported and filenames can contain spaces. Keep distinct descriptive names, for example:

- original/original.jpg
- upscaled/upscaled-2x.png
- upscaled/upscaled-4k.png
- poster/poster-10032px.jpg
- transparent/transparent-v1.png
- transparent/transparent-v2.png
- enhanced/enhanced-swirl.png

These are examples, not required filenames. Do not upload a ZIP unless you extract its images first.

The existing `python3 tools/build_pages.py` build scans this folder recursively and creates `assets/gallery/index.json` in the published site. GitHub Pages deploys and Docker builds already use this build script. After adding files to main, wait for the Pages deployment; for Docker, rebuild and redeploy the image. For a local review run `python3 tools/build_pages.py` and `python3 -m http.server 8000 --directory _site`, then open `/concept-two/assets-gallery.html`.

The review index links to the gallery. Pixel dimensions and embedded DPI are extracted from PNG and JPEG headers without third-party packages. JPEG EXIF density takes precedence over JFIF. Other supported image types use browser dimensions; their DPI is explicitly labelled unrecorded/unsupported. EXIF orientation is accounted for in JPEG dimensions. Print dimensions are calculations, not a guarantee of print quality. DPI metadata is not invented or written back to images.

The gallery uses original files, loaded lazily. Very large images can take time and memory to decode. Transparent files retain their alpha; background controls only change the preview surface. Files here are publicly downloadable wherever this website is published. Do not upload confidential material.
