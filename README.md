
# 🎮 Arborito Games (The Arcade)

**The future of educational gaming: context-aware engines.**

> *"One Game. Infinite Topics. Any Language. Optionally AI-powered."*

---

## 🤯 What is this? (The Innovation)

**Stop hardcoding questions. Start building engines.**

In traditional ed-tech, to teach "History" you build a History game; to teach "Physics" you build a Physics game; you ship a different title for every subject and every language. It's slow, expensive, and the moment a teacher wants to teach something you didn't anticipate, you're stuck.

**Arborito flips it.**

You build a generic **Engine**: a card duel, a memory grid, a trivia show, and Arborito feeds it the **lesson content** at runtime. For **Pygame, bots, kiosks, and offline apps**, use the **[Python SDK](https://github.com/treesys-org/arborito-sdk)** instead of this repo.

You don't write the questions. You don't pick the language. You don't choose the curriculum. **The lesson author already did all of that**: your job is the mechanic.

## 🚀 Two ways to ship: same content underneath

This repo holds **both surfaces** the platform supports. Pick the one that matches your game idea; the API names are identical so what you learn in one transfers to the other.

| Surface | Where it lives | What you ship | What you get for free |
|---|---|---|---|
| **🪐 Arcade SDK** (HTML cartridge) | `cartridges/<name>/` | A folder: `index.html` + `meta.json`. No build step. | Runs inside Arborito's in-app Arcade. `window.arborito` injected by the host. Profile, XP, SRS, AI bridge. |
| **🐍 Python SDK** | **[`arborito-sdk`](https://github.com/treesys-org/arborito-sdk)** (separate repo) | A standalone Python program. Pygame, terminal, Discord bot, kiosk, etc. | Native graphics / audio. You pick the curriculum at startup (`.arborito` file). CLI: `arborito-cli`. |

**This repo (`arborito-games`) is for Arcade cartridges only.** Python games live in the `arborito-sdk` repo.

Both speak the same vocabulary: `lesson.next()`, `challenge.fromLesson(...)`, `memory.report(...)`, `ask.json(...)`, `xp(...)`, etc. **You learn it once.**

> Think of it like the Web platform: cartridges are the *web apps* (sandboxed, free distribution, host integration), the Python SDK is the *native apps* (your runtime, your store, full system access). Same Arborito content underneath.

## Publishing your game (like Flathub)

**Arborito Games** is the public Arcade catalog: browser cartridges (`cartridges/`) that Arborito loads via CDN from this repo’s root **`manifest.json`**.

1. **Fork** [treesys-org/arborito-games](https://github.com/treesys-org/arborito-games).
2. **Create** `cartridges/your-game/index.html` + `meta.json`.
3. **Regenerate** the catalog with `python game_builder.py` (or add an entry to root **`manifest.json`**: `id`, `name`, `path`, …).
4. **Open a PR.** After merge, your game appears in the in-app Arcade for every Arborito user.

Players pick a **module + game** in Arborito; your cartridge receives `window.arborito` with the lesson playlist. Same API names as the Python SDK (`lesson`, `challenge`, `memory`, …). Python game ideas live in [arborito-sdk](https://github.com/treesys-org/arborito-sdk).

See [PYTHON_SDK.md](https://github.com/treesys-org/arborito/blob/main/docs/PYTHON_SDK.md) in the main app repo.

## ⚡ How it works

1. **The user** opens a lesson: say, *"Photosynthesis"* in **Spanish**: and launches a game from the in-app Arcade. (Or a native game launches and loads a `.arborito` archive directly.)
2. **The host** injects `window.arborito` (or the Python `Arborito(...)` object): identity, current lesson, the lesson's authored questionnaires, language, AI mode, spaced-repetition state.
3. **Your engine** picks a questionnaire: `arborito.challenge.fromLesson(lesson)`: and renders it however your mechanic demands: card flip, RPG combat, jeopardy buzzer, memory grid.
4. **The player wins.** Your engine reports XP and the recall quality back to Arborito's spaced-repetition system, which decides when the player should review that topic next.
5. **A different player** opens a different lesson tomorrow: *"French Revolution"* in **English**: and the **exact same engine** now teaches that, in that language, at that difficulty.

One game. Infinite topics. Any language. **Built-in memory.** Optionally AI-powered.

---

## 🪶 Static or dynamic: AI is optional

Every Arborito lesson is markdown text. A lesson **may also ship one or more `@quiz` blocks**: multiple-choice, cloze, ordering, recall, written by the lesson author. Games consume that content in two modes depending on what the player has installed:

| Mode | What you read | When |
|------|---------------|------|
| **Static** *(default, no AI required)* | `arborito.challenge.fromLesson(lesson)` returns the questionnaires already in the lesson. | Most users; works fully offline. |
| **Dynamic** *(optional, requires Sage / llama.cpp)* | `arborito.ask.json("…prompt…")` asks a local LLM for new JSON content. | Users who configured AI; great for free-form narrative or to invent extras on top of the static questionnaires. |

Your game can support either or both. Check what's available with **`arborito.getAIMode()`**: returns `'static'` or `'dynamic'`. **A perfectly good Arborito game makes zero AI calls.**

---

## 🛠️ Path A: HTML cartridge in 5 minutes (static mode, zero AI)

This minimal cartridge picks the first questionnaire from the active lesson, shows it as a card, scores the answer, and updates spaced repetition. No LLM involved.

### Step 1: Folder

```text
cartridges/
 super-quiz/
 index.html
 meta.json
```

### Step 2: `meta.json`

```json
{
 "name": "Super Quiz",
 "description": "One question per lesson, straight from the lesson's quiz block.",
 "icon": "🧠",
 "version": "1.0.0",
 "author": "Me"
}
```

### Step 3: `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
 body { background:#1a1a1a; color:#fff; font-family:system-ui, sans-serif; padding:32px; text-align:center; }
 h1 { margin:0 0 24px; }
 .opt-btn, button#next { display:block; margin:8px auto; padding:12px 20px; font-size:1rem;
 background:#22c55e; color:#000; border:0; border-radius:10px; cursor:pointer; }
 .opt-btn[disabled] { opacity:.6; cursor:default; }
 #result { margin-top:16px; font-weight:bold; min-height:1.4em; }
 .empty { color:#94a3b8; }
</style>
</head>
<body>
 <h1 id="title">Loading…</h1>
 <div id="card"></div>
 <p id="result"></p>
 <button id="next" hidden>Next lesson →</button>

<script type="module">
 const a = window.arborito;

 async function playRound() {
 document.getElementById('result').textContent = '';
 document.getElementById('next').hidden = true;

 // 1. Read the next lesson from Arborito's playlist.
 const lesson = await a.lesson.next();
 document.getElementById('title').textContent = lesson.title;

 // 2. Pull the lesson's built-in questionnaires (static mode, no AI).
 const challenges = a.challenge.fromLesson(lesson);
 if (!challenges.length) {
 document.getElementById('card').innerHTML =
 `<p class="empty">This lesson has no quiz block. Skip to next.</p>`;
 document.getElementById('next').hidden = false;
 return;
 }

 // 3. Pick the first questionnaire and a playable mode (multiple / cloze / chips / steps / recall).
 const challenge = challenges[0];
 const modes = a.challenge.modes;
 const mode = modes.playable(challenge)[0] || 'multiple';
 const card = modes.buildCard(challenge, mode, {
 lessonTitle: lesson.title,
 lang: a.user.lang
 });

 // 4. Render the question + the answer area built by the SDK.
 document.getElementById('card').innerHTML = `
 <p style="font-size:1.3rem">${a.platform.escapeHtml(card.question)}</p>
 ${modes.renderAnswers(card, { showOpts: true, lang: a.user.lang })}
 `;

 // 5. Score the player's pick.
 document.querySelectorAll('.opt-btn').forEach(btn => {
 btn.addEventListener('click', () => {
 const correct = btn.dataset.value === card.correct;
 document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
 document.getElementById('result').textContent =
 correct ? '✅ Correct!' : `❌ Was: ${card.correct}`;
 // 6. Tell Arborito how it went (XP + spaced repetition update).
 if (correct) a.xp(50);
 a.memory.report(lesson.id, correct ? 5 : 1);
 document.getElementById('next').hidden = false;
 });
 });
 }

 document.getElementById('next').addEventListener('click', playRound);
 playRound();
</script>
</body>
</html>
```

Drop the folder in `cartridges/` and push. Arborito’s Arcade loads this catalog via CDN from the published `manifest.json` (see Arcade settings in the app). Cartridges live only in this repo.

---

## 🐍 Path B: Native game with the Python SDK

For games **outside** Arborito's iframe, use the **[`arborito-sdk`](https://github.com/treesys-org/arborito-sdk)** repository:

```bash
git clone https://github.com/treesys-org/arborito-sdk.git
cd arborito-sdk
pip install -e .
```

```python
from arborito_sdk import Arborito

api = Arborito.from_arborito("/path/to/course.arborito", lang="EN")
lesson = api.lesson.next()
for challenge in api.challenge.fromLesson(lesson):
    card = api.challenge.modes.buildStudyCard(challenge, block_id="cli")
    print(card["question"], "→", card["correct"])
```

CLI: `arborito-cli list course.arborito` · `arborito-cli quiz course.arborito --rounds 5` · Example: `examples/minimal_quiz.py`

**Rule:** native Python games load a **`.arborito` export at startup** (file picker, CLI arg, or share code). The SDK mirrors the browser contract; you choose the course path in your app. Course catalog titles live in `manifest.json` → `meta.titles` (per curriculum language); cartridges keep using `lesson.title` / `window.arborito.lesson` as before — no cartridge API change.

Full reference: [arborito-sdk README](https://github.com/treesys-org/arborito-sdk/blob/main/README.md) · [sdk-spec.md](https://github.com/treesys-org/arborito/blob/main/docs/sdk-spec.md).

---

## 🎯 The shape of the game is yours

The constraint is **"speak the API"**. Everything else is up to you.

### Already shipping in this repo

| Cartridge | Surface | Mechanic |
|---|---|---|
| 🃏 `alonso-duel` | HTML | Two-player Quiz V2 card duel. Every Arborito modality on screen, multiple, recall, cloze, chips, steps. |
| 🧠 `memory` (`memory-garden` in manifest) | HTML | Pair-matching grid + flip-card spaced-repetition; the world withers when memory decays and blooms when you water it. |
| 🎓 `classroom` (`classroom-sim` in manifest) | HTML | Classmates take turns; fixed 3-slot blackboard per topic page. |
| 💼 `firstjob` | HTML | Job-interview gauntlet with a reputation meter. |
| 🚀 `starship` | HTML | Galaxy hub: every planet is a lesson; use `lesson.plainText()` for dialogue. |
| 💻 `hacky-terminal` | HTML | Retro shell: `lessons`, `play`, bash missions from lesson content; static or Sage-powered dynamic mode. |
| 🍎 `wrong-fruit` | HTML | Catch the correct answer fruit; question banner + memory/XP on each hit. |

Native Python demos and the CLI live in **[`arborito-sdk`](https://github.com/treesys-org/arborito-sdk)** (`examples/minimal_quiz.py`, `arborito-cli quiz`, `arborito-cli edit` with `[tui]`).

### Things waiting for you to build

The substrate handles them all. Pick a row and start:

- 🎮 **Pygame action title**: bullet-hell where the enemy's shield drops when you cloze-fill a word from the lesson.
- 📖 **Ren'Py visual novel**: branching dialogue whose choices are quiz options; bad answers re-route the story.
- 🩺 **Offline medical trainer**: a frozen `.arborito` curriculum bundled with a Pyglet GUI; runs on a laptop in a remote clinic, no internet, no Arborito app required.
- 🤖 **Discord bot**: every morning, fetch the user's due queue and DM them a question.
- ✅ **Headless CI validator**: fail the build if a contributor's lesson has a malformed `@quiz`.
- 🖥️ **Museum kiosk**: fullscreen Pygame, a single hard-coded curriculum, no menus, no escape; visitors play, the kiosk forgets them.
- 🌌 **Twine narrative**: branches whose checkpoints update SRS; the player's reading speed becomes a difficulty knob.
- 🎪 **TV-show-style multiplayer trivia**: host runs the game, players phone-buzz answers, the scoreboard pulls from `memory.due()` to bias toward what the room actually needs to review.

**The lesson author writes the content. You write the experience.**

---

## 🧠 Spaced Repetition (Memory)

Arborito's SRS engine (SM-2) decides which lessons are about to be forgotten. Your game can read that signal and report back the player's recall quality.

```javascript
// Browser cartridge, Python is the same names on `api.memory`.
const due = a.memory.due(); // ['uuid-1', 'uuid-2', ...]
const isWithered = due.includes(lesson.id);
a.memory.report(lesson.id, quality); // quality: 0..5
```

| Quality | Meaning | Game equivalent |
|---|---|---|
| 0 | Blackout | Player failed completely. |
| 1 | Wrong | Most answers wrong. |
| 2 | Hard | Passed under 50%. |
| 3 | Pass | Standard win. |
| 4 | Good | Solid win, fast. |
| 5 | Perfect | Flawless. |

Memory Garden flips its visual theme based on `due()` so that "watering" a withered lesson is a literal in-game mechanic.

In the Python SDK, wire your own store for `memory.*` if you need persistence; Arcade injects host SRS for free on cartridges.

---

## 🔌 Bridge API reference (`window.arborito`)

The cartridge surface injects one global. Each section below also notes Python parity (`api.<same name>`).

```text
arborito.user: who is playing [Python: api.user, you supply]
arborito.lesson.next/list/at: lesson content [Python: same]
arborito.challenge.*: read the lesson's questionnaires [Python: same]
arborito.memory.*: spaced repetition [Python: optional, provide your own backend]
arborito.xp(n) / save / load: gamification + persistence [Python: extension point]
arborito.platform.*: tap / screen / escape helpers [Python: not present, browser only]
arborito.ask.json: call the local LLM (optional) [Python: same, hits llama-server]
arborito.getAIMode(): 'static' | 'dynamic' [Python: same]
arborito.exit(): close the game modal [Python: not present]
```

> **Why `window`?** Cartridges run in an iframe; there is no shared bundler with the host. The host injects a small classic `<script>` that sets `window.arborito` before your module scripts run. You can wrap it (`const a = window.arborito`) or read it from any module.

### 1. Identity (`arborito.user`)

```javascript
a.user.username // "Alice"
a.user.lang // "EN" | "ES" | "DE" | … (use to localize prompts and UI)
a.user.avatar // emoji or URL
```

### 2. Lessons (`arborito.lesson`)

```javascript
const lesson = await a.lesson.next(); // active lesson, advances cursor
const list = a.lesson.list(); // [{ id, title, index, status }]
const l3 = await a.lesson.at(3); // jump to a specific index
const meta = a.lesson.readMeta(lesson); // { tags } from the lesson's @info block
const prose = a.lesson.plainText(lesson); // NPC / HUD, no @section or @quiz metadata
```

| Field / method | Use |
|----------------|-----|
| `lesson.title` | Display title |
| `lesson.text` | Cleaned prose from host |
| `lesson.plainText(lesson)` | Same cleaning, explicit (preferred for dialogue) |
| `lesson.raw` | Full markdown, avoid in UI |
| `challenge.fromLesson(lesson)` | Quiz V2 questionnaires |

### 3. Questionnaires: static mode (`arborito.challenge`)

This is where you read the lesson's built-in quizzes. **No AI involved.**

```javascript
const challenges = a.challenge.fromLesson(lesson); // 0..N questionnaires per lesson
const c = challenges[0];

const modes = a.challenge.modes;
const mode = modes.playable(c)[0]; // best playable: multiple / cloze / chips / steps / recall
const card = modes.buildCard(c, mode, { lessonTitle: lesson.title, lang: a.user.lang });

card.question // string
card.correct // expected answer (multiple / recall / cloze)
card.options // [string, ...] for multiple
card.sequence // [string, ...] for chips / steps (correct order)
card.chips // [string, ...] for chips / steps (shuffled tokens to drag)
card.mode // the chosen mode
```

| Method | What it does |
|---|---|
| `fromLesson(lesson)` | All questionnaires of the lesson. |
| `modes.playable(c)` | Modes the questionnaire has data for. |
| `modes.buildCard(c, mode, opts)` | UI-neutral card data (above). |
| `modes.label(mode, lang)` | Translated mode name (`'cloze' → 'Hueco'`). |
| `modes.className(mode)` | CSS class fragment (`' is-mode-cloze'`) for styling. |
| `modes.isOrdering(card)` | `true` for chips/steps. |
| `modes.checkOrder(card, picked)` | Validate the player's drag order. |
| `modes.renderAnswers(card, opts)` | Ready-to-inject HTML for the answer area. **Browser only**: the Python SDK has the data, you draw your own UI. |

### 4. Spaced repetition (`arborito.memory`)

```javascript
a.memory.due() // [lessonId, ...]
a.memory.isDue(lessonId) // boolean shortcut
a.memory.getStatus(lessonId) // { health, interval, isDue, ... }
a.memory.report(lessonId, q) // q: 0..5
```

### 5. Gamification + persistence

```javascript
a.xp(100); // award global XP
a.save('my_high_score', 5000); // per-game key/value (synced or local). ~195 KB cap.
const v = await a.load('my_high_score');
```

### 6. Platform helpers (`arborito.platform`)

Stuff every cartridge ends up needing. The SDK provides them so you don't copy them into every game.

```javascript
const offTap = a.platform.onTap(button, () => playRound()); // tap that doesn't double on mobile
const offScreen = a.platform.onScreenChange(() => layout(), [canvas]); // resize / rotate
const { width, height } = a.platform.getScreenSize(); // accounts for mobile chrome
host.innerHTML = `<p>${a.platform.escapeHtml(text)}</p>`; // safe insertion
offTap(); offScreen(); // call cleanups on exit
```

| Method | What it does |
|---|---|
| `onTap(el, fn)` | Click + touch combined, no ghost click. Returns `cleanup()`. |
| `getScreenSize()` | `{ width, height }` of the usable area. |
| `onScreenChange(fn, watch?)` | Fires on resize / rotate / element resize. Returns `cleanup()`. |
| `escapeHtml(s)` | Safe text for `innerHTML`. |
| `escapeAttr(s)` | Safe value for HTML attributes. |

### 7. AI (`arborito.ask`): optional

Only call these if you actually need fresh content beyond the lesson's questionnaires. Always check first:

```javascript
if (a.getAIMode() === 'dynamic') {
 const items = await a.ask.json("Generate 3 trivia items… JSON: [{q,a}]");
}
```

| Method | What it does |
|---|---|
| `getAIMode()` | `'static'` (no AI) or `'dynamic'` (LLM available). |
| `ask.json(prompt, onComplete?, opts?)` | Sends `prompt` to the local LLM, parses JSON response. Throws an `Error` with `error.code` set to one of `AI_TIMEOUT`, `AI_SAGE_ERROR`, `AI_PARSE_ERROR`, `AI_EMPTY_RESPONSE`, `AI_NETWORK`. |
| `ask.chat(messages, ctxNode?)` | Free-form chat. |
| `quiz(lesson, opts)` | Sugar: small array of trivia items. Static-mode-aware. |
| `matchPairs(lesson, opts)` | Sugar: `[{ t, d }]` term/definition pairs. Static-mode-aware. |

`a.ERROR_CODES` exposes the same strings for comparison.

### 8. Other

```javascript
a.exit(); // close the game modal (host-dependent)
```

---

## ⚖️ Assets & licensing

The whole catalogue is **asset-free** by design, no copyright risk, no third-party CDN.

- **Graphics**: procedurally generated on Canvas.
- **Icons**: standard Unicode emojis.
- **Fonts**: system stack only (no Google Fonts, no webfont CDN).
- **Audio**: synthesized at runtime with the Web Audio API.

Cartridges that ship binary assets will be rejected. Code: GPL-3.0. See [`NOTICE`](NOTICE) for tooling licenses (Tailwind, Vite, etc.).

The Python SDK does **not** impose the asset rule on your native game, distribute it as you like, license your own art however you choose. Just keep the lesson content under whatever license the original lesson author granted.

---

## 🎨 Tailwind (local build, no CDN)

The arcade hub (`index.html`) uses Tailwind utilities. One stylesheet is built locally:

| Path | Role |
|------|------|
| `src/styles/tailwind.entry.css` | `@tailwind` entry, edit here. |
| `public/tailwind.css` | **Generated**: `npm run build:css` produces it. |
| `tailwind.config.js` | Scans `index.html` and `cartridges/**/*.{html,js}`. |

`npm install` then `npm run dev` (Vite runs `build:css` first via `predev`). New contributors: see [`docs/DEVELOPMENT.md`](https://github.com/treesys-org/arborito/blob/main/docs/DEVELOPMENT.md).

## Publishing

Merge to **`main`** on this repo (via pull request). Arborito’s Arcade loads root **`manifest.json`** from jsDelivr, run `python game_builder.py` after adding cartridges, or keep the manifest in sync manually.

The **Arborito app** pins jsDelivr `@main` to the **latest GitHub commit SHA** when loading games (see `arcade-games-cdn.js`), so fixes on `main` appear within ~90s without waiting for CDN edge expiry. Bump **`meta.json` `version`** when you change cartridge behaviour so testers can confirm what loaded.

Changelog: [`CHANGELOG.md`](CHANGELOG.md).

---

## Community

Chat: [Matrix #arborito:matrix.org](https://matrix.to/#/%23arborito:matrix.org) · [treesys.org](https://treesys.org)

## 📄 License

GPL-3.0. PRs welcome, keep cartridges static-friendly so they work without an LLM, and follow the asset rule above. Native Python games can do whatever they want. Third-party build tooling: [`NOTICE`](NOTICE).
