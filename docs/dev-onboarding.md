# Developer onboarding: Arborito Games

This repo ships **browser Arcade cartridges** only (`cartridges/`). The Python SDK lives in [`arborito-sdk`](https://github.com/treesys-org/arborito-sdk); the main app in [`arborito`](https://github.com/treesys-org/arborito).

## Layout

```text
arborito-games/
├── manifest.json ← catalog published to GitHub (Arcade loads via jsDelivr)
├── CHANGELOG.md ← cartridge version notes (bump meta.json when behaviour changes)
├── game_builder.py ← regenerate manifest.json from cartridges/
├── cartridges/ ← one folder per game (index.html + meta.json)
├── index.html ← local hub to preview cartridges
├── public/tailwind.css ← generated; do not edit by hand
└── src/styles/ ← Tailwind entry
```

Each cartridge talks to **`window.arborito`** injected by the Arborito app. Full API: [`arborito/docs/sdk-spec.md`](https://github.com/treesys-org/arborito/blob/main/docs/sdk-spec.md).

## Commands

```bash
npm install
npm run dev # Vite + rebuilds Tailwind (predev)
npm run build:css # after editing src/styles/tailwind.entry.css
python game_builder.py # refresh manifest.json after adding cartridges
```

Open the dev server URL and pick a cartridge from the hub. For in-app testing, point Arborito Arcade at this repo’s published `manifest.json` (see main app Arcade settings).

## Adding a cartridge

1. Create `cartridges/<id>/` with `index.html` and `meta.json` (**set `version`** in meta).
2. Run `python game_builder.py` (or add an entry to root **`manifest.json`**: `id`, `name`, `path`, …).
3. Keep games **asset-free** (no binary art, no CDN fonts): see root [`README.md`](../README.md).

## Lesson text in cartridges

| API | When |
|-----|------|
| `lesson.plainText(lesson)` | NPC dialogue, HUD, TTS, strips `@section`, `@quiz`, markdown |
| `lesson.text` | Host-cleaned prose (same intent) |
| `lesson.raw` | Full markdown, parsing only, not UI |
| `challenge.fromLesson(lesson)` | Quiz data |

Requires a recent **Arborito** host with `lesson-plain-text.js` / bridge `getLessonPlainText`.

## Publishing & CDN

Open a **pull request** on GitHub. After merge to `main`:

- jsDelivr serves the updated catalog.
- The **Arborito app** rewrites `@main` URLs to `@<commit-sha>` (~90s cache) so players get fresh JS without stale edge copies.

Document behaviour changes in [`CHANGELOG.md`](../CHANGELOG.md) and bump `meta.json` version.

## Current cartridge versions (check `meta.json`)

| Cartridge | Version | Notes |
|-----------|---------|--------|
| classroom | 1.2.2 | Fixed 3-slot blackboard |
| starship | 3.0.1 | Planet exit performance; `plainText` dialogue |
| alonso-duel | 3.0.0 | |
| memory | 2.4.0 | |
| firstjob | 5.0.0 | |
| hacky-terminal | 2.1.0 | |

## Related docs

| Doc | Topic |
|-----|--------|
| [`../README.md`](../README.md) | API tutorial, cartridge list, Tailwind |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Release notes |
| [`arborito/docs/sdk-spec.md`](https://github.com/treesys-org/arborito/blob/main/docs/sdk-spec.md) | Browser Arcade contract (`hacky-terminal` cartridge) |
| [`arborito/docs/sdk-spec.md`](https://github.com/treesys-org/arborito/blob/main/docs/sdk-spec.md) | Full `window.arborito` contract |
| [`arborito-sdk/CLI.md`](https://github.com/treesys-org/arborito-sdk/blob/main/CLI.md) | Terminal course editor (`edit`, F2 Quiz) |
