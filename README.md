
# 🎮 Arborito Games (The Arcade)

**The future of educational gaming: context-aware engines.**

> *"One Game. Infinite Topics. Any Language. Optionally AI-powered."*

---

## 🤯 What is this? (The Innovation)

**Stop hardcoding questions. Start building engines.**

In traditional ed-tech, to teach "History" you build a History game; to teach "Physics" you build a Physics game; you ship a different title for every subject and every language. It's slow, expensive, and the moment a teacher wants to teach something you didn't anticipate, you're stuck.

**Arborito flips it.**

You build a generic **Engine** — a card duel, a memory grid, a starship hub, a trivia show, a Pygame action game, a Discord bot — and Arborito feeds it the **lesson content** at runtime. The same engine ships *English biology* on Tuesday and *Spanish history on Wednesday*. The same code that quizzes a kid on photosynthesis quizzes a developer on Linux commands two clicks later.

You don't write the questions. You don't pick the language. You don't choose the curriculum. **The lesson author already did all of that** — your job is the mechanic.

## 🚀 Two ways to ship — same content underneath

This repo holds **both surfaces** the platform supports. Pick the one that matches your game idea; the API names are identical so what you learn in one transfers to the other.

| Surface | Where it lives | What you ship | What you get for free |
|---|---|---|---|
| **🪐 HTML Cartridge** | `cartridges/<name>/` | A folder: `index.html` + `meta.json`. No build step. | Runs inside Arborito's in-app Arcade. Free distribution to every player. Profile, XP, SRS scheduling, AI bridge — all wired without any setup on your side. |
| **🐍 Python SDK** | `sdk/` (`pip install -e .`) | A standalone Python program. Pygame title, Pyglet shoot-em-up, Tk trainer, terminal tool, Discord bot, classroom kiosk, museum installation, headless validator, server-side bot — anything Python lets you build. | Native graphics / audio / GPU / multithreading. You pick the curriculum at startup (file, folder, public Nostr share code, live subscription). You distribute through Steam, itch, app stores, your own installer. |

Both speak the same vocabulary: `lesson.next()`, `challenge.fromLesson(...)`, `memory.report(...)`, `ask.json(...)`, `xp(...)`, etc. **You learn it once.**

> Think of it like the Web platform: cartridges are the *web apps* (sandboxed, free distribution, host integration), the Python SDK is the *native apps* (your runtime, your store, full system access). Same Arborito content underneath.

## ⚡ How it works

1. **The user** opens a lesson — say, *"Photosynthesis"* in **Spanish** — and launches a game from the in-app Arcade. (Or a native game launches and loads a `.arborito` archive directly.)
2. **The host** injects `window.arborito` (or the Python `Arborito(...)` object): identity, current lesson, the lesson's authored questionnaires, language, AI mode, spaced-repetition state.
3. **Your engine** picks a questionnaire — `arborito.challenge.fromLesson(lesson)` — and renders it however your mechanic demands: card flip, RPG combat, jeopardy buzzer, memory grid.
4. **The player wins.** Your engine reports XP and the recall quality back to Arborito's spaced-repetition system, which decides when the player should review that topic next.
5. **A different player** opens a different lesson tomorrow — *"French Revolution"* in **English** — and the **exact same engine** now teaches that, in that language, at that difficulty.

One game. Infinite topics. Any language. **Built-in memory.** Optionally AI-powered.

---

## 🪶 Static or dynamic — AI is optional

Every Arborito lesson is markdown text. A lesson **may also ship one or more `@quiz` blocks**: multiple-choice, cloze, ordering, recall — written by the lesson author. Games consume that content in two modes depending on what the player has installed:

| Mode | What you read | When |
|------|---------------|------|
| **Static** *(default, no AI required)* | `arborito.challenge.fromLesson(lesson)` returns the questionnaires already in the lesson. | Most users; works fully offline. |
| **Dynamic** *(optional, requires Sage / llama.cpp)* | `arborito.ask.json("…prompt…")` asks a local LLM for new JSON content. | Users who configured AI; great for free-form narrative or to invent extras on top of the static questionnaires. |

Your game can support either or both. Check what's available with **`arborito.getAIMode()`** — returns `'static'` or `'dynamic'`. **A perfectly good Arborito game makes zero AI calls.**

---

## 🛠️ Path A — HTML cartridge in 5 minutes (static mode, zero AI)

This minimal cartridge picks the first questionnaire from the active lesson, shows it as a card, scores the answer, and updates spaced repetition. No LLM involved.

### Step 1 — Folder

```text
cartridges/
  super-quiz/
    index.html
    meta.json
```

### Step 2 — `meta.json`

```json
{
  "name": "Super Quiz",
  "description": "One question per lesson, straight from the lesson's quiz block.",
  "icon": "🧠",
  "version": "1.0.0",
  "author": "Me"
}
```

### Step 3 — `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  body { background:#1a1a1a; color:#fff; font-family:system-ui, sans-serif; padding:32px; text-align:center; }
  h1   { margin:0 0 24px; }
  .opt-btn, button#next { display:block; margin:8px auto; padding:12px 20px; font-size:1rem;
                          background:#22c55e; color:#000; border:0; border-radius:10px; cursor:pointer; }
  .opt-btn[disabled] { opacity:.6; cursor:default; }
  #result { margin-top:16px; font-weight:bold; min-height:1.4em; }
  .empty  { color:#94a3b8; }
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

    // 2. Pull the lesson's built-in questionnaires (static mode — no AI).
    const challenges = a.challenge.fromLesson(lesson);
    if (!challenges.length) {
      document.getElementById('card').innerHTML =
        `<p class="empty">This lesson has no quiz block. Skip to next.</p>`;
      document.getElementById('next').hidden = false;
      return;
    }

    // 3. Pick the first questionnaire and a playable mode (multiple / cloze / chips / steps / recall).
    const challenge = challenges[0];
    const modes     = a.challenge.modes;
    const mode      = modes.playable(challenge)[0] || 'multiple';
    const card      = modes.buildCard(challenge, mode, {
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

Drop the folder in `cartridges/` and push to **this** repo. Arborito loads the catalog from the published `manifest.json` over HTTP (see the main app's Arcade settings). **You do not copy games into the arborito app repo.**

---

## 🐍 Path B — Native game with the Python SDK

If you want a game that lives **outside** Arborito's iframe — Pygame, terminal, GUI, Discord bot, server, classroom kiosk, native desktop app, anything Python lets you build — install the SDK as a library:

```bash
cd sdk
pip install -e .                  # requires Python 3.10+
```

The minimum-viable Python game is four lines:

```python
from arborito_sdk import Arborito

api = Arborito.from_arborito("/path/to/course.arborito", lang="ES")
lesson = api.lesson.next()
for challenge in api.challenge.fromLesson(lesson):
    card = api.challenge.modes.buildStudyCard(challenge, blockId="cli")
    print(card["question"], "→", card["correct"])
```

That program reads the same lesson archive Arborito uses, walks every questionnaire, and prints each card. Wrap it in Pygame, in a Tk window, in a Telegram bot, in a Pyglet shoot-'em-up, in a Discord slash command — your choice. The Arborito library has done its job (curriculum + Quiz V2 parsing + AI plumbing); your code does the game.

What Python adds that the cartridge surface can't:

- **Native graphics / audio / GPU / multithreading.** Pygame, Arcade, Pyglet, OpenCV, PyTorch, native engines via FFI.
- **Pick the curriculum yourself.** Load a `.arborito` archive, point at a static `data/` folder, fetch a public tree from a Nostr share code (`api = Arborito.from_share_code("ABCD-EF23")`), or subscribe to live updates (`api.subscribe(on_update=...)`).
- **Distribute outside Arborito.** Ship through Steam, itch.io, app stores, your own installer — the SDK has no central catalogue, you control distribution.
- **Run headless.** Use it from CI to validate a course, from a backend to generate reports, from a bot that quizzes a Discord channel every morning.

What it gives up vs. the cartridge:

- No automatic profile / SRS feedback into Arborito's Care tab (the player gets none of the cross-game XP and review scheduling unless they also use the in-app player).
- You ship the runtime (Python + your deps) and the LLM server (`llama-server`) if you want dynamic mode.
- You implement your own consent flow if you open `wss://` connections (`from_share_code`, `subscribe`).

Full reference, options, and the parity table with the browser bridge: [`sdk/README.md`](sdk/README.md) · [`../arborito/docs/sdk-spec.md`](../arborito/docs/sdk-spec.md).

---

## 🎯 The shape of the game is yours

The constraint is **"speak the API"**. Everything else is up to you.

### Already shipping in this repo

| Cartridge | Surface | Mechanic |
|---|---|---|
| 🃏 `alonso-duel` | HTML | Two-player Quiz V2 card duel. Every Arborito modality on screen — multiple, recall, cloze, chips, steps. |
| 🌿 `memory-garden` | HTML | Pair-matching grid + flip-card spaced-repetition; the world withers when memory decays and blooms when you water it. |
| 🎓 `classroom-sim` | HTML | Classmates take turns; you outscore them in trivia generated from whatever lesson is loaded. |
| 💼 `firstjob` | HTML | Job-interview gauntlet with a reputation meter. |
| 🚀 `starship` | HTML | Galaxy hub: every planet is a lesson, the narrative is composed by `ask.json`. |
| ⌨️ `sdk/examples/quiz_game.py` | Python CLI | Reference walker: every modality, every challenge, every `@exam` node — in your terminal. |

### Things waiting for you to build

The substrate handles them all. Pick a row and start:

- 🎮 **Pygame action title** — bullet-hell where the enemy's shield drops when you cloze-fill a word from the lesson.
- 📖 **Ren'Py visual novel** — branching dialogue whose choices are quiz options; bad answers re-route the story.
- 🩺 **Offline medical trainer** — a frozen `.arborito` curriculum bundled with a Pyglet GUI; runs on a laptop in a remote clinic, no internet, no Arborito app required.
- 🤖 **Discord bot** — every morning, fetch the user's due queue and DM them a question.
- ✅ **Headless CI validator** — fail the build if a contributor's lesson has a malformed `@quiz`.
- 🖥️ **Museum kiosk** — fullscreen Pygame, a single hard-coded curriculum, no menus, no escape; visitors play, the kiosk forgets them.
- 🌌 **Twine narrative** — branches whose checkpoints update SRS; the player's reading speed becomes a difficulty knob.
- 🎪 **TV-show-style multiplayer trivia** — host runs the game, players phone-buzz answers, the scoreboard pulls from `memory.due()` to bias toward what the room actually needs to review.

**The lesson author writes the content. You write the experience.**

---

## 🧠 Spaced Repetition (Memory)

Arborito's SRS engine (SM-2) decides which lessons are about to be forgotten. Your game can read that signal and report back the player's recall quality.

```javascript
// Browser cartridge — Python is the same names on `api.memory`.
const due = a.memory.due();           // ['uuid-1', 'uuid-2', ...]
const isWithered = due.includes(lesson.id);
a.memory.report(lesson.id, quality);  // quality: 0..5
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

In the Python SDK, `memory.due()` and `memory.report()` are stubs by default — you plug your own scheduler if you want it persisted. Stick to the cartridge surface if you want SRS for free.

---

## 🔌 Bridge API reference (`window.arborito`)

The cartridge surface injects one global. Each section below also notes Python parity (`api.<same name>`).

```text
arborito.user                    — who is playing                      [Python: api.user, you supply]
arborito.lesson.next/list/at     — lesson content                      [Python: same]
arborito.challenge.*             — read the lesson's questionnaires    [Python: same]
arborito.memory.*                — spaced repetition                   [Python: stubs by default]
arborito.xp(n) / save / load     — gamification + persistence          [Python: stubs — implement yourself]
arborito.platform.*              — tap / screen / escape helpers       [Python: not present, browser only]
arborito.ask.json                — call the local LLM (optional)       [Python: same, hits llama-server]
arborito.getAIMode()             — 'static' | 'dynamic'                [Python: same]
arborito.exit()                  — close the game modal                [Python: not present]
```

> **Why `window`?** Cartridges run in an iframe; there is no shared bundler with the host. The host injects a small classic `<script>` that sets `window.arborito` before your module scripts run. You can wrap it (`const a = window.arborito`) or read it from any module.

### 1. Identity (`arborito.user`)

```javascript
a.user.username   // "Alice"
a.user.lang       // "EN" | "ES" | "DE" | …  (use to localize prompts and UI)
a.user.avatar     // emoji or URL
```

### 2. Lessons (`arborito.lesson`)

```javascript
const lesson = await a.lesson.next();    // active lesson, advances cursor
const list   = a.lesson.list();          // [{ id, title, index, status }]
const l3     = await a.lesson.at(3);     // jump to a specific index
const meta   = a.lesson.readMeta(lesson); // { tags } from the lesson's @info block
```

### 3. Questionnaires — static mode (`arborito.challenge`)

This is where you read the lesson's built-in quizzes. **No AI involved.**

```javascript
const challenges = a.challenge.fromLesson(lesson);   // 0..N questionnaires per lesson
const c          = challenges[0];

const modes = a.challenge.modes;
const mode  = modes.playable(c)[0];                  // best playable: multiple / cloze / chips / steps / recall
const card  = modes.buildCard(c, mode, { lessonTitle: lesson.title, lang: a.user.lang });

card.question  // string
card.correct   // expected answer (multiple / recall / cloze)
card.options   // [string, ...] for multiple
card.sequence  // [string, ...] for chips / steps (correct order)
card.chips     // [string, ...] for chips / steps (shuffled tokens to drag)
card.mode      // the chosen mode
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
| `modes.renderAnswers(card, opts)` | Ready-to-inject HTML for the answer area. **Browser only** — the Python SDK has the data, you draw your own UI. |

### 4. Spaced repetition (`arborito.memory`)

```javascript
a.memory.due()                    // [lessonId, ...]
a.memory.isDue(lessonId)          // boolean shortcut
a.memory.getStatus(lessonId)      // { health, interval, isDue, ... }
a.memory.report(lessonId, q)      // q: 0..5
```

### 5. Gamification + persistence

```javascript
a.xp(100);                        // award global XP
a.save('my_high_score', 5000);    // per-game key/value (synced or local). ~195 KB cap.
const v = await a.load('my_high_score');
```

### 6. Platform helpers (`arborito.platform`)

Stuff every cartridge ends up needing. The SDK provides them so you don't copy them into every game.

```javascript
const offTap    = a.platform.onTap(button, () => playRound());          // tap that doesn't double on mobile
const offScreen = a.platform.onScreenChange(() => layout(), [canvas]);  // resize / rotate
const { width, height } = a.platform.getScreenSize();                   // accounts for mobile chrome
host.innerHTML = `<p>${a.platform.escapeHtml(text)}</p>`;               // safe insertion
offTap(); offScreen();                                                  // call cleanups on exit
```

| Method | What it does |
|---|---|
| `onTap(el, fn)` | Click + touch combined, no ghost click. Returns `cleanup()`. |
| `getScreenSize()` | `{ width, height }` of the usable area. |
| `onScreenChange(fn, watch?)` | Fires on resize / rotate / element resize. Returns `cleanup()`. |
| `escapeHtml(s)` | Safe text for `innerHTML`. |
| `escapeAttr(s)` | Safe value for HTML attributes. |

### 7. AI (`arborito.ask`) — optional

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
a.exit();   // close the game modal (host-dependent)
```

---

## ⚖️ Assets & licensing

The whole catalogue is **asset-free** by design — no copyright risk, no third-party CDN.

- **Graphics**: procedurally generated on Canvas.
- **Icons**: standard Unicode emojis.
- **Fonts**: system stack only (no Google Fonts, no webfont CDN).
- **Audio**: synthesized at runtime with the Web Audio API.

Cartridges that ship binary assets will be rejected. Code: GPL-3.0. See [`NOTICE`](NOTICE) for tooling licenses (Tailwind, Vite, etc.).

The Python SDK does **not** impose the asset rule on your native game — distribute it as you like, license your own art however you choose. Just keep the lesson content under whatever license the original lesson author granted.

---

## 🎨 Tailwind (local build, no CDN)

The arcade hub (`index.html`) uses Tailwind utilities. One stylesheet is built locally:

| Path | Role |
|------|------|
| `src/styles/tailwind.entry.css` | `@tailwind` entry — edit here. |
| `public/tailwind.css` | **Generated** — `npm run build:css` produces it. |
| `tailwind.config.js` | Scans `index.html` and `cartridges/**/*.{html,js}`. |

`npm install` then `npm run dev` (Vite runs `build:css` first via `predev`). New contributors: see [`docs/dev-onboarding.md`](docs/dev-onboarding.md).

---

## 📄 License

GPL-3.0. PRs welcome — keep cartridges static-friendly so they work without an LLM, and follow the asset rule above. Native Python games can do whatever they want.
