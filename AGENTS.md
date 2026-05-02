# Agent Guidance for Özel Eğitim Oyunu

## Project overview
- Static web-based Turkish educational game with multiple mini-games.
- Uses plain HTML/CSS/JavaScript, built into `www/` and packaged with Capacitor for Android.
- The source files live at the repo root (`*.html`, `css/`, `js/`, `assets/`), while `www/` is the generated web output.

## Key build/runtime commands
- `npm run build` — runs `node build.js`, copies root web assets into `www/`, and increments the service worker cache version in `sw.js`.
- `npm start` — builds the web app and serves `www/` locally at `http://localhost:3000`.
- `npm run cap:sync` — builds, then syncs Capacitor assets to Android.
- `npm run cap:android` — opens the Android Capacitor project.
- `npm run optimize` — runs image optimization via `node optimize_images.js`.

## Important conventions
- `build.js` is the canonical build process. Do not edit `www/` directly; regenerate it from the root sources.
- Root-level `.html` pages and `manifest.json`/`sw.js` are copied to `www/` during build.
- JavaScript code is in `js/`; page markup is at the repo root and mirrored into `www/`.
- Static assets are in `assets/`; they are also copied into `www/`.
- `capacitor.config.json` defines the Android app ID, web directory, and plugin settings.

## Key files to inspect or modify
- `build.js` — build script and service worker version bump logic
- `package.json` — npm scripts and Capacitor dependency versions
- `capacitor.config.json` — Android/Capacitor configuration
- `sw.js` — service worker cache name and caching behavior
- `manifest.json` — web manifest and app metadata
- `js/` — interactive game logic for mini-games
- `css/style.css` — global styling

## Testing and validation notes
- The repo includes Python Playwright test scripts (`test_gameplay.py`, `test_recon.py`).
- The tests assume a local server at `http://localhost:3000`.
- There is no existing README or contributor guide in this repo.

## Agent behavior guidance
- Prefer editing source files in the repo root and regenerate `www/` via `npm run build`.
- Treat `www/` as generated output unless making build-tooling fixes.
- Do not assume there is a backend; this project is client-side static content.
- Use the existing `package.json` npm scripts as the canonical developer workflow.
