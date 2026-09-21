# Innovate Connects — static starter

A self-contained, Docker-deployable static landing page implementing the initial brand system and visual direction.

## Run locally

```bash
docker compose up --build
```

Open `http://localhost:8080`.

## Deploy

Copy this directory to the server and run:

```bash
docker compose up -d --build
```

Place it behind your existing Cloudflare/Tailscale/reverse-proxy setup as appropriate. Change `8080:80` in `docker-compose.yml` if port 8080 is already in use.

## Project structure

- `public/index.html` — composed homepage
- `public/assets/css/` — tokens, header and hero styles
- `public/assets/js/` — navigation behaviour
- `public/assets/art/` — full hero artwork
- `public/assets/brand/` — connectivity mark
- `public/assets/icons/` — methodology icon strip
- `public/assets/textures/` — tileable grain

## Notes

- All generated decorative SVGs are local and require no third-party requests.
- The navigation links are placeholders; point them to real routes when these pages exist.
- The mobile menu closes on navigation click and Escape.
- For a multi-page static deployment, replace the SPA fallback in `nginx.conf` with `try_files $uri $uri =404;` once each page has its own HTML file.
# innovate-connects
