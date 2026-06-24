# Arborito Python SDK

Same logical API as `window.arborito` in the browser Arcade, for **independent game creators** prototyping outside the iframe (Pygame, terminal, server, CI, etc.).

Full contract: [`../../arborito/docs/sdk-spec.md`](../../arborito/docs/sdk-spec.md)

## Install

```bash
cd arborito-games/sdk
pip install -e .
```

Requires Python 3.10+. For dynamic mode: a running [llama.cpp](https://github.com/ggml-org/llama.cpp) server (`llama-server`) exposing the OpenAI-compatible `/v1/chat/completions` endpoint. Configure via `LLAMA_CPP_HOST` (default `http://127.0.0.1:8080`) and optionally `LLAMA_CPP_MODEL`.

## Load a tree

| Source | Use case | Typical mode |
|--------|----------|------------------|
| **`.arborito`** | Exported trees / demo archives | `static` (Quiz V2, no LLM) |
| **Static `data/` folder** | Same layout as a self-hosted static site | `static` or `dynamic` |

```python
from arborito_sdk import Arborito

api = Arborito.from_arborito("/path/to/course.arborito", lang="ES")
lesson = api.lesson.next()
challenges = api.challenge.fromLesson(lesson)  # all blocks, including @exam nodes

modes = api.challenge.modes.playable(challenges[0])
card = api.challenge.modes.buildCard(challenges[0], modes[0], lesson_title=lesson["title"], lang="ES")
```

## Quiz V2 modalities

The SDK exposes the same five modes as the in-app Care view:

| Mode | Learner action |
|------|----------------|
| `multiple` | Pick the correct option |
| `recall` | Recall the answer |
| `cloze` | Fill a blank in the definition |
| `chips` | Order words to form the answer |
| `steps` | Order procedural steps |

Use `api.challenge.modes.*` for full rendering data. Use `api.quiz(lesson)` when you only need quick multiple-choice items.

## API (browser parity)

| Member | Python | Notes |
|--------|--------|-------|
| `user` | yes | `username`, `lang`, `avatar` |
| `getAIMode()` | yes | `'static'` \| `'dynamic'` |
| `lesson.next/list/at/readMeta` | yes | |
| `ask.json` / `ask.chat` | yes | llama.cpp server; raises in static mode |
| `quiz(lesson, opts)` | yes | Static: Quiz V2; dynamic: llama.cpp server |
| `matchPairs(lesson, opts)` | yes | Memory-style pairs |
| `challenge.*` | yes | `isComplete`, `fromLesson`, `buildDuelDeck`, … |
| `challenge.modes.*` | partial | All five Quiz V2 modes; `label` is mirrored. `className`, `isOrdering`, `checkOrder`, `renderAnswers` are **browser-only** UI helpers. |
| `platform.*` | no | Browser-only: `onTap`, `getScreenSize`, `onScreenChange`, `escapeHtml`, `escapeAttr`. Desktop/CLI engines own their own input loop. |
| `meta.read(lesson)` | yes | |
| `memory.due/getStatus/isDue/report` | stubs | Implement your own offline SRS |
| `xp`, `save`, `load`, `exit` | stubs | Electron host implements these for real |

Error codes: `ArboritoError.code` — `AI_TIMEOUT`, `AI_SAGE_ERROR`, `AI_PARSE_ERROR`, `AI_EMPTY_RESPONSE`, `AI_NETWORK`.

## Example game

One CLI example covers all five modalities and multi-challenge exam nodes:

```bash
python3 examples/quiz_game.py
python3 examples/quiz_game.py --arborito /path/to/course.arborito --rounds 10
python3 examples/quiz_game.py --mode-only cloze --rounds 5
```

## HTML cartridges vs Python engines

- **HTML/JS cartridge** in `cartridges/`: runs in the Arcade iframe; uses injected `window.arborito` (including `challenge.modes`).
- **Custom Python engine**: install this package, load the same curriculum (`.arborito`), call the same API.

Stubs (`xp`, `save`, `memory.report`) are intentionally no-ops: in a desktop game, persist progress in your own SQLite/JSON.

## License

GPL-3.0-or-later (same as arborito-games).
