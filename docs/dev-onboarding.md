# Arborito Games — onboarding

## Tailwind (no CDN)

This repo builds **one** stylesheet: `public/tailwind.css`, from `src/styles/tailwind.entry.css`, using the Tailwind CLI (`npm run build:css`). It is linked as **`/tailwind.css`** from the arcade `index.html` and every cartridge `index.html`.

Run **`npm install`**, then **`npm run dev`** (Vite runs `build:css` first via `predev`). If you change classes and they do not appear, run `npm run build:css` again or use `npm run watch:css` in a second terminal.

## Layout

* **Arcade hub:** root `index.html` — uses Tailwind utility classes for the game grid.
* **Cartridges:** `cartridges/<name>/index.html` — each game still has **local `<style>`** for canvas/CRT/game-specific UI; Tailwind is available for **shared utilities** (`hidden`, `flex`, `text-red-500`, …) and for gradual migration.

## `node_modules/`

Same as any npm project: third-party tools (Vite, Tailwind, PostCSS). Do not commit it; recreate with `npm install`. See `NOTICE` for Tailwind MIT terms.
