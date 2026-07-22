/**
 * Wrong Fruit, garden worm quiz game.
 * Eat correct-answer fruits; avoid traps, hedges, rocks, and garden gnomes.
 * Session: a few lessons with short stage runs (not an endless 50-stage grind).
 */
const bindTap = (window.arborito?.platform?.onTap) || ((el, fn) => { el.addEventListener('click', fn); return () => {}; });

const GRID = 16;
/** Max lessons chained in one garden session before a natural finish. */
const MAX_SESSION_LESSONS = 4;
/** Stages per lesson: enough for progress, short enough to finish. */
const STAGES_PER_LESSON_MIN = 3;
const STAGES_PER_LESSON_MAX = 6;
/** Canvas-drawn fruit faces (no emoji glyphs, many hosts show □ / blank). */
const FRUIT_FACES = [
 { body: '#ef4444', leaf: '#22c55e', spot: '#fca5a5' }, // apple
 { body: '#f97316', leaf: '#16a34a', spot: '#fdba74' }, // orange
 { body: '#a855f7', leaf: '#4ade80', spot: '#d8b4fe' }, // grape cluster tint
 { body: '#f43f5e', leaf: '#22c55e', spot: '#fda4af' }, // berry
 { body: '#fb7185', leaf: '#86efac', spot: '#fecdd3' }, // peach
 { body: '#84cc16', leaf: '#166534', spot: '#bef264' }, // kiwi
 { body: '#facc15', leaf: '#65a30d', spot: '#fde047' }, // lemon
 { body: '#3b82f6', leaf: '#22c55e', spot: '#93c5fd' }, // blueberry
 { body: '#dc2626', leaf: '#4ade80', spot: '#f87171' }, // cherry
 { body: '#2dd4bf', leaf: '#15803d', spot: '#99f6e4' }, // melon
];
const GNOME_FACES = [
 { hat: '#b91c1c', skin: '#fde68a', beard: '#f8fafc' },
 { hat: '#7c3aed', skin: '#fcd34d', beard: '#e2e8f0' },
 { hat: '#0f766e', skin: '#fbbf24', beard: '#f1f5f9' },
];
/** Large on-board question banner, long enough to read before it fades. */
const QUESTION_FLASH_MS = 7000;

const STR = {
 EN: {
 title: 'Wrong Fruit',
 startBody:
 'Eat fruits with the <strong>right</strong> answers. Dodge hedges, rocks, and gnomes. Wrong fruit ends the run. A few lessons per session, then a clear finish.',
 startBtn: 'Enter the garden',
 hintDefault: 'Eat the correct fruit · Avoid gnomes & traps',
 stage: 'STAGE',
 lessonChip: 'Lesson {n}/{total}',
 needMore: 'Need {n} more correct',
 needOne: 'Need 1 more correct',
 gnomes: 'Gnomes',
 pattern: 'Pattern',
 findFruit: 'Find the right fruit',
 noBridge: "Couldn't connect to the course.",
 noLesson: "Couldn't load a lesson.",
 noQuiz: 'This lesson has no quiz, add @quiz blocks to play.',
 hitBarrier: 'Hit a barrier!',
 bitTail: 'Bit your own tail!',
 gnomeGotYou: 'A garden gnome got you!',
 wrongFruit: 'Wrong fruit!',
 allClear: 'Session complete, garden cleared!',
 lessonClear: 'Lesson cleared! Next orchard…',
 winTitle: 'Garden cleared!',
 loseTitle: 'The orchard won…',
 endMsg: 'Score {score} · Reached stage {stage}/{total}',
 nextLesson: 'Next session',
 retry: 'Retry garden',
 wrongN: 'Wrong {n}',
 patterns: {
 empty: 'open field',
 border: 'hedge border',
 cross: 'cross paths',
 corners: 'corner rocks',
 maze: 'maze',
 rings: 'rings',
 checker: 'checker',
 chaos: 'chaos',
 },
 },
 ES: {
 title: 'Wrong Fruit',
 startBody:
 'Come las frutas con las respuestas <strong>correctas</strong>. Esquiva setos, rocas y gnomos. Un fruto equivocado termina la partida. Varias lecciones por sesión, con un final claro.',
 startBtn: 'Entrar al jardín',
 hintDefault: 'Come la fruta correcta · Evita gnomos y trampas',
 stage: 'ETAPA',
 lessonChip: 'Lección {n}/{total}',
 needMore: 'Faltan {n} correctas',
 needOne: 'Falta 1 correcta',
 gnomes: 'Gnomos',
 pattern: 'Mapa',
 findFruit: 'Busca la fruta correcta',
 noBridge: 'No se pudo conectar con el curso.',
 noLesson: 'No se pudo cargar una lección.',
 noQuiz: 'Esta lección no tiene cuestionario: añade bloques @quiz para jugar.',
 hitBarrier: '¡Chocaste con una barrera!',
 bitTail: '¡Te mordiste la cola!',
 gnomeGotYou: '¡Un gnomo del jardín te atrapó!',
 wrongFruit: '¡Fruto equivocado!',
 allClear: '¡Sesión completa, jardín despejado!',
 lessonClear: '¡Lección superada! Siguiente huerto…',
 winTitle: '¡Jardín despejado!',
 loseTitle: 'El huerto ganó…',
 endMsg: 'Puntos {score} · Llegaste a la etapa {stage}/{total}',
 nextLesson: 'Otra sesión',
 retry: 'Reintentar jardín',
 wrongN: 'Incorrecto {n}',
 patterns: {
 empty: 'campo abierto',
 border: 'seto perimetral',
 cross: 'cruces',
 corners: 'rocas en esquina',
 maze: 'laberinto',
 rings: 'anillos',
 checker: 'tablero',
 chaos: 'caos',
 },
 },
};

const GAME_TITLE = 'Wrong Fruit';
const SLOW_MO_MS = 10000;
const SLOW_MO_FACTOR = 4.5;

function resolveLang() {
 const raw = String(window.arborito?.user?.lang || window.arborito?.lang || 'EN').toUpperCase();
 return raw.startsWith('ES') ? 'ES' : 'EN';
}

function t(key, vars = {}) {
 const lang = resolveLang();
 let line = STR[lang]?.[key] ?? STR.EN[key] ?? key;
 if (typeof line !== 'string') return key;
 Object.entries(vars).forEach(([k, v]) => {
 line = line.replaceAll(`{${k}}`, String(v));
 });
 return line;
}

function patternLabel(pattern) {
 const lang = resolveLang();
 return STR[lang]?.patterns?.[pattern] || STR.EN.patterns[pattern] || pattern;
}

function stagesForLesson(quizCount) {
 const n = Math.max(1, Number(quizCount) || 1);
 return Math.min(STAGES_PER_LESSON_MAX, Math.max(STAGES_PER_LESSON_MIN, n));
}

function sessionLessonCap() {
 const list = window.arborito?.lesson?.list?.() || [];
 const n = Array.isArray(list) ? list.length : 1;
 return Math.max(1, Math.min(MAX_SESSION_LESSONS, n || 1));
}

/** Progressive stage definitions keyed by global stage within the session. */
function stageConfig(n, totalStages = 12) {
 const total = Math.max(1, totalStages);
 const i = Math.max(1, Math.min(total, n));
 const t = (i - 1) / Math.max(1, total - 1);
 const speed = Math.max(85, Math.round(200 - t * 110));
 const gnomes = Math.min(4, Math.floor(t * 4) + (i >= 3 ? 1 : 0));
 const need = Math.min(5, 2 + Math.floor(t * 3));
 const traps = Math.min(2, Math.floor(t * 3));
 let pattern = 'empty';
 if (t >= 0.12 && t < 0.28) pattern = 'border';
 else if (t >= 0.28 && t < 0.42) pattern = 'cross';
 else if (t >= 0.42 && t < 0.55) pattern = 'corners';
 else if (t >= 0.55 && t < 0.68) pattern = 'maze';
 else if (t >= 0.68 && t < 0.82) pattern = 'rings';
 else if (t >= 0.82 && t < 0.92) pattern = 'checker';
 else if (t >= 0.92) pattern = 'chaos';
 return { stage: i, speed, gnomes, need, traps, pattern };
}

function buildWalls(pattern) {
 const walls = new Set();
 const add = (x, y) => {
 if (x >= 0 && y >= 0 && x < GRID && y < GRID) walls.add(`${x},${y}`);
 };
 const edge = () => {
 for (let i = 0; i < GRID; i++) {
 add(i, 0); add(i, GRID - 1); add(0, i); add(GRID - 1, i);
 }
 };
 if (pattern === 'border') edge();
 if (pattern === 'cross') {
 for (let i = 2; i < GRID - 2; i++) { add(Math.floor(GRID / 2), i); add(i, Math.floor(GRID / 2)); }
 }
 if (pattern === 'corners') {
 for (let i = 0; i < 4; i++) {
 add(i, i); add(GRID - 1 - i, i); add(i, GRID - 1 - i); add(GRID - 1 - i, GRID - 1 - i);
 }
 for (let i = 0; i < 3; i++) {
 add(2 + i, 2); add(2, 2 + i);
 add(GRID - 3 - i, 2); add(GRID - 3, 2 + i);
 add(2 + i, GRID - 3); add(2, GRID - 3 - i);
 add(GRID - 3 - i, GRID - 3); add(GRID - 3, GRID - 3 - i);
 }
 }
 if (pattern === 'maze') {
 for (let y = 2; y < GRID - 2; y += 3) {
 for (let x = 1; x < GRID - 1; x++) {
 if (x % 4 !== (y % 2)) add(x, y);
 }
 }
 }
 if (pattern === 'rings') {
 for (let i = 0; i < GRID; i++) {
 add(i, 2); add(i, GRID - 3); add(2, i); add(GRID - 3, i);
 }
 for (let i = 4; i < GRID - 4; i++) {
 add(i, 5); add(i, GRID - 6);
 }
 walls.delete(`7,2`); walls.delete(`8,2`);
 walls.delete(`7,${GRID - 3}`); walls.delete(`8,${GRID - 3}`);
 walls.delete(`2,7`); walls.delete(`2,8`);
 walls.delete(`${GRID - 3},7`); walls.delete(`${GRID - 3},8`);
 }
 if (pattern === 'checker') {
 for (let y = 1; y < GRID - 1; y++) {
 for (let x = 1; x < GRID - 1; x++) {
 if ((x + y) % 4 === 0) add(x, y);
 }
 }
 }
 if (pattern === 'chaos') {
 edge();
 for (let y = 2; y < GRID - 2; y += 2) {
 for (let x = 2; x < GRID - 2; x += 3) add(x, y);
 }
 for (let i = 3; i < GRID - 3; i++) add(i, Math.floor(GRID / 2));
 walls.delete(`7,${Math.floor(GRID / 2)}`);
 walls.delete(`8,${Math.floor(GRID / 2)}`);
 }
 for (let dy = -1; dy <= 1; dy++) {
 for (let dx = -1; dx <= 2; dx++) walls.delete(`${7 + dx},${7 + dy}`);
 }
 return walls;
}

function buildQuizzes(lesson) {
 const api = window.arborito?.challenge;
 if (!api?.fromLesson) return [];
 const challenges = api.fromLesson(lesson) || [];
 const modes = api.modes;
 const lang = resolveLang();
 const pool = [];
 const allWrong = [];
 const junk = new Set([': ', '\u2014', '-', '…', '...', 'N/A', 'Unknown']);
 for (const c of challenges) {
 const playable = modes?.playable?.(c) || [];
 const mode = playable.includes('multiple') ? 'multiple' : playable[0];
 if (!mode) continue;
 const card = modes.buildCard(c, mode, {
 lessonTitle: lesson.title,
 lang,
 distractorPool: challenges
 .map((ch) => {
 const play = modes?.challengeForPlay?.(ch) || ch;
 return String(play?.correct_answer || play?.short_definition || '').trim();
 })
 .filter(Boolean)
 });
 if (!card?.correct) continue;
 const correct = String(card.correct).trim();
 const cleanOpts = (card.options || [])
 .map(String)
 .map((s) => s.trim())
 .filter((s) => s && !junk.has(s));
 if (cleanOpts.length >= 2) {
 pool.push({
 question: card.question || lesson.title,
 correct,
 options: [...new Set(cleanOpts)],
 challenge: c,
 lessonId: lesson.id
 });
 cleanOpts.forEach((o) => {
 if (o !== correct) allWrong.push(o);
 });
 } else {
 pool.push({ question: card.question, correct, options: null, challenge: c, lessonId: lesson.id });
 }
 }
 return pool.map((q) => {
 if (q.options?.length >= 2) return q;
 const distractors = shuffle([...new Set(allWrong.filter((w) => w !== q.correct))]).slice(0, 3);
 while (distractors.length < 3) distractors.push(t('wrongN', { n: distractors.length + 1 }));
 return { ...q, options: [q.correct, ...distractors.slice(0, 3)] };
 });
}

function shuffle(arr) {
 const a = [...arr];
 for (let i = a.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [a[i], a[j]] = [a[j], a[i]];
 }
 return a;
}

/**
 * Wrap text to fit maxWidth / maxLines. Returns null if it cannot fit without
 * dropping content (caller should shrink font or widen).
 */
function tryWrapLabel(ctx, text, maxWidth, maxLines) {
 const raw = String(text || '').trim();
 if (!raw) return [];
 const words = raw.split(/\s+/);
 const lines = [];
 let cur = '';

 for (const word of words) {
 const trial = cur ? `${cur} ${word}` : word;
 if (ctx.measureText(trial).width <= maxWidth) {
 cur = trial;
 continue;
 }
 if (cur) {
 lines.push(cur);
 cur = '';
 if (lines.length >= maxLines) return null;
 }
 if (ctx.measureText(word).width <= maxWidth) {
 cur = word;
 continue;
 }
 // Break oversized tokens mid-word (no spaces between chunks).
 let chunk = '';
 for (const ch of word) {
 const next = chunk + ch;
 if (chunk && ctx.measureText(next).width > maxWidth) {
 lines.push(chunk);
 chunk = ch;
 if (lines.length >= maxLines) return null;
 } else {
 chunk = next;
 }
 }
 cur = chunk;
 }
 if (cur) {
 if (lines.length >= maxLines) return null;
 lines.push(cur);
 }
 return lines;
}

/**
 * Fit a fruit answer label: shrink font, then wrap; avoid ellipsis whenever
 * the full answer can still be shown.
 */
function fitLabel(ctx, text, maxWidth, maxLines, maxSize, minSize) {
 const raw = String(text || '').trim();
 if (!raw) return { lines: [], size: maxSize };
 for (let size = maxSize; size >= minSize; size -= 1) {
 ctx.font = `bold ${size}px system-ui,sans-serif`;
 const lines = tryWrapLabel(ctx, raw, maxWidth, maxLines);
 if (lines) return { lines, size };
 }
 ctx.font = `bold ${minSize}px system-ui,sans-serif`;
 const fallback = tryWrapLabel(ctx, raw, maxWidth, maxLines + 2);
 if (fallback) return { lines: fallback, size: minSize };
 // Extreme last resort only (very long unbroken strings on tiny boards).
 let last = raw;
 while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
 return { lines: [`${last}…`], size: minSize };
}

class WrongFruit {
 constructor() {
 this.canvas = document.getElementById('canvas');
 this.ctx = this.canvas.getContext('2d');
 this.lesson = null;
 this.quizzes = [];
 this.quizIdx = 0;
 this.stage = 1;
 this.stageInLesson = 1;
 this.stagesThisLesson = STAGES_PER_LESSON_MIN;
 this.sessionLessonIndex = 1;
 this.sessionLessonCap = MAX_SESSION_LESSONS;
 this.totalStages = STAGES_PER_LESSON_MIN * MAX_SESSION_LESSONS;
 this.score = 0;
 this.lives = 3;
 this.goodThisStage = 0;
 this.snake = [];
 this.dir = { x: 1, y: 0 };
 this.nextDir = { x: 1, y: 0 };
 this.fruits = [];
 this.gnomes = [];
 this.walls = new Set();
 this.cfg = stageConfig(1);
 this.timer = null;
 this.running = false;
 this.wonLastRun = false;
 this.particles = [];
 this.pulse = 0;
 this.cell = 24;
 this.tickAcc = 0;
 this.lastFrameTs = 0;
 this.slowMoStart = 0;
 this.slowMoUntil = 0;
 this._bannerTimer = null;
 this._stageTimer = null;
 this._rafHandle = 0;
 this._applyStaticCopy();
 this._bindUi();
 window.addEventListener('resize', () => this._resize());
 }

 _applyStaticCopy() {
 document.documentElement.lang = resolveLang() === 'ES' ? 'es' : 'en';
 document.title = GAME_TITLE;
 const brand = document.getElementById('brand-title');
 if (brand) brand.textContent = GAME_TITLE.toUpperCase();
 const startTitle = document.getElementById('start-title');
 if (startTitle) startTitle.textContent = GAME_TITLE;
 const startDesc = document.getElementById('start-desc');
 if (startDesc) startDesc.innerHTML = t('startBody');
 const btnStart = document.getElementById('btn-start');
 if (btnStart) btnStart.textContent = t('startBtn');
 const btnNext = document.getElementById('btn-next');
 if (btnNext) btnNext.textContent = t('nextLesson');
 const btnRetry = document.getElementById('btn-retry');
 if (btnRetry) btnRetry.textContent = t('retry');
 const hint = document.getElementById('q-hint');
 if (hint) hint.textContent = t('hintDefault');
 }

 _bindUi() {
 bindTap(document.getElementById('btn-start'), () => this.startRun());
 bindTap(document.getElementById('btn-retry'), () => this.startRun());
 bindTap(document.getElementById('btn-next'), async () => {
 // Start a fresh session from the next lesson in the playlist.
 try { await window.arborito?.lesson?.next?.(); } catch (_) {}
 const ok = await this._loadLesson({ resetSession: true });
 if (ok) this.startRun();
 });
 document.querySelectorAll('#dpad [data-dir]').forEach((btn) => {
 bindTap(btn, () => this._setDir(btn.dataset.dir));
 });
 window.addEventListener('keydown', (e) => {
 const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
 if (map[e.key]) { e.preventDefault(); this._setDir(map[e.key]); }
 });
 let sx = 0, sy = 0;
 const wrap = document.getElementById('game-wrap');
 wrap.addEventListener('touchstart', (e) => {
 const tch = e.changedTouches[0];
 sx = tch.clientX; sy = tch.clientY;
 }, { passive: true });
 wrap.addEventListener('touchend', (e) => {
 const tch = e.changedTouches[0];
 const dx = tch.clientX - sx, dy = tch.clientY - sy;
 if (Math.hypot(dx, dy) < 24) return;
 if (Math.abs(dx) > Math.abs(dy)) this._setDir(dx > 0 ? 'right' : 'left');
 else this._setDir(dy > 0 ? 'down' : 'up');
 }, { passive: true });
 }

 _setDir(name) {
 const map = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
 const d = map[name];
 if (!d) return;
 if (this.dir.x + d.x === 0 && this.dir.y + d.y === 0) return;
 this.nextDir = d;
 }

 _resize() {
 const wrap = document.getElementById('game-wrap');
 const app = document.getElementById('app');
 if (!wrap || app?.classList.contains('hidden')) return;
 const pad = 8;
 const w = Math.max(0, (wrap.clientWidth || wrap.offsetWidth || 0) - pad);
 const h = Math.max(0, (wrap.clientHeight || wrap.offsetHeight || 0) - pad);
 const fallback = Math.min(window.innerWidth, window.innerHeight) - 48;
 let size = Math.min(w || fallback, h || fallback);
 if (!Number.isFinite(size) || size < 240) size = Math.max(240, Math.min(fallback, 720));
 size = Math.min(size, 780);
 this.cell = Math.max(18, Math.floor(size / GRID));
 const px = this.cell * GRID;
 this.canvas.width = px;
 this.canvas.height = px;
 this.canvas.style.width = `${px}px`;
 this.canvas.style.height = `${px}px`;
 }

 async boot() {
 this._applyStaticCopy();
 const arb = window.arborito;
 if (!arb?.lesson || !arb?.challenge) {
 document.getElementById('start-desc').textContent = t('noBridge');
 document.getElementById('btn-start').disabled = true;
 return;
 }
 await this._loadLesson();
 }

 /** Load current lesson quizzes. Returns true when the garden can start. */
 async _loadLesson({ advance = false, resetSession = false } = {}) {
 const arb = window.arborito;
 const btn = document.getElementById('btn-start');
 try {
 if (advance) {
 this.lesson = (await arb?.lesson?.next?.()) || arb?.lesson?.current || null;
 } else {
 this.lesson = arb?.lesson?.current || (await arb?.lesson?.at?.(0)) || (await arb?.lesson?.next?.());
 }
 } catch (_) {
 this.lesson = null;
 }
 if (!this.lesson) {
 document.getElementById('start-desc').textContent = t('noLesson');
 if (btn) btn.disabled = true;
 this.quizzes = [];
 return false;
 }
 this.quizzes = buildQuizzes(this.lesson);
 this.quizIdx = 0;
 this.stagesThisLesson = stagesForLesson(this.quizzes.length);
 if (resetSession || !this.sessionLessonCap) {
 this.sessionLessonCap = sessionLessonCap();
 this.sessionLessonIndex = 1;
 this.totalStages = this.stagesThisLesson * this.sessionLessonCap;
 } else {
 // Recompute remaining estimate so HUD stays honest mid-session.
 const remainingLessons = Math.max(0, this.sessionLessonCap - this.sessionLessonIndex + 1);
 this.totalStages = this.stage - 1 + this.stagesThisLesson * remainingLessons;
 }
 document.getElementById('lesson-topic').textContent = this.lesson.title || '…';
 if (!this.quizzes.length) {
 document.getElementById('start-desc').textContent = t('noQuiz');
 if (btn) btn.disabled = true;
 return false;
 }
 if (btn) btn.disabled = false;
 return true;
 }

 startRun() {
 if (!this.quizzes.length) return;
 document.getElementById('start-screen').classList.add('hidden');
 document.getElementById('end-screen').classList.add('hidden');
 document.getElementById('app').classList.remove('hidden');
 this.sessionLessonCap = sessionLessonCap();
 this.sessionLessonIndex = 1;
 this.stagesThisLesson = stagesForLesson(this.quizzes.length);
 this.totalStages = this.stagesThisLesson * this.sessionLessonCap;
 this.stage = 1;
 this.stageInLesson = 1;
 this.score = 0;
 this.lives = 3;
 this.quizIdx = 0;
 this.wonLastRun = false;
 if (this._stageTimer) {
 clearTimeout(this._stageTimer);
 this._stageTimer = null;
 }
 this.running = false;
 this._stopLoop();
 // Layout is 0 while #app was display:none, measure after paint.
 requestAnimationFrame(() => {
 this._resize();
 this._beginStage();
 });
 }

 _beginStage() {
 this._resize();
 this.cfg = stageConfig(this.stage, this.totalStages);
 this.walls = buildWalls(this.cfg.pattern);
 this.snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
 this.dir = { x: 1, y: 0 };
 this.nextDir = { x: 1, y: 0 };
 this.goodThisStage = 0;
 this.particles = [];
 this.tickAcc = 0;
 this.lastFrameTs = 0;
 this.slowMoStart = 0;
 this.slowMoUntil = 0;
 document.getElementById('game-wrap')?.classList.remove('slow-mo');
 // Fruits first so answer options always get free cells; gnomes fill leftovers.
 this.fruits = [];
 this.gnomes = [];
 this._spawnFruits(true);
 this._spawnGnomes();
 this._updateHud();
 this.running = true;
 this._startReadSlowMo();
 this._ensureRaf();
 }

 _showBanner(text, ms = 900) {
 const el = document.getElementById('stage-banner');
 if (!el) return;
 if (this._bannerTimer) {
 clearTimeout(this._bannerTimer);
 this._bannerTimer = null;
 }
 const span = el.querySelector('span');
 if (span) span.textContent = text;
 el.classList.remove('show');
 // Force a hide→show cycle so the previous question never lingers on screen.
 void el.offsetWidth;
 el.classList.add('show');
 this._bannerTimer = setTimeout(() => {
 el.classList.remove('show');
 this._bannerTimer = null;
 }, ms);
 }

 /** Large question on the board (≥7s) + soft bar glow so players can read it. */
 _flashQuestion() {
 const q = this.quizzes[this.quizIdx % this.quizzes.length];
 const text = q?.question || t('findFruit');
 this._showBanner(text, QUESTION_FLASH_MS);
 const bar = document.getElementById('question-bar');
 if (!bar) return;
 bar.classList.remove('q-glow');
 void bar.offsetWidth;
 bar.classList.add('q-glow');
 }

 /** Interval between ticks (ms). Higher = slower. */
 _tickInterval() {
 const base = this.cfg.speed;
 if (!this.slowMoUntil) return base;
 const now = performance.now();
 if (now >= this.slowMoUntil) {
 this.slowMoUntil = 0;
 this.slowMoStart = 0;
 document.getElementById('game-wrap')?.classList.remove('slow-mo');
 return base;
 }
 const t = Math.min(1, Math.max(0, (now - this.slowMoStart) / SLOW_MO_MS));
 // Ease out: start very slow, ramp to normal over 10s.
 const eased = 1 - (1 - t) * (1 - t);
 const slow = base * SLOW_MO_FACTOR;
 return slow + (base - slow) * eased;
 }

 _startReadSlowMo() {
 const now = performance.now();
 this.slowMoStart = now;
 this.slowMoUntil = now + SLOW_MO_MS;
 document.getElementById('game-wrap')?.classList.add('slow-mo');
 this._flashQuestion();
 }

 _updateHud() {
 document.getElementById('stage-chip').textContent = `${t('stage')} ${this.stage}/${this.totalStages}`;
 document.getElementById('score-chip').textContent = `${this.score}`;
 document.getElementById('lives-chip').textContent = `♥ ${this.lives}`;
 const q = this.quizzes[this.quizIdx % this.quizzes.length];
 document.getElementById('q-text').textContent = q?.question || t('findFruit');
 const left = Math.max(0, this.cfg.need - this.goodThisStage);
 const needLine = left === 1 ? t('needOne') : t('needMore', { n: left });
 const lessonLine = t('lessonChip', { n: this.sessionLessonIndex, total: this.sessionLessonCap });
 document.getElementById('q-hint').textContent =
 `${needLine} · ${lessonLine} · ${t('gnomes')}: ${this.cfg.gnomes} · ${t('pattern')}: ${patternLabel(this.cfg.pattern)}`;
 }

 _occupied() {
 const s = new Set(this.walls);
 this.snake.forEach((p) => s.add(`${p.x},${p.y}`));
 this.fruits.forEach((f) => s.add(`${f.x},${f.y}`));
 this.gnomes.forEach((g) => s.add(`${g.x},${g.y}`));
 return s;
 }

 _emptyCell() {
 const occ = this._occupied();
 const free = [];
 for (let y = 0; y < GRID; y++) {
 for (let x = 0; x < GRID; x++) {
 if (!occ.has(`${x},${y}`)) free.push({ x, y });
 }
 }
 return free.length ? free[Math.floor(Math.random() * free.length)] : null;
 }

 _spawnGnomes() {
 this.gnomes = [];
 for (let i = 0; i < this.cfg.gnomes; i++) {
 const cell = this._emptyCell();
 if (!cell) break;
 const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
 this.gnomes.push({
 ...cell,
 dir: dirs[i % 4],
 face: i % GNOME_FACES.length,
 step: 0,
 // Move every tick (pace 1) so they are clearly alive on screen.
 pace: 1
 });
 }
 }

 _spawnFruits(full = true) {
 // Replace the whole set for the current quiz, never leave prior-question
 // answers on the board mixed with the new options.
 if (full) this.fruits = [];
 const q = this.quizzes[this.quizIdx % this.quizzes.length];
 if (!q) return;
 const correct = String(q.correct).trim();
 const raw = [...(q.options || [q.correct])].map((o) => String(o).trim());
 const others = shuffle([...new Set(raw.filter((o) => o && o !== correct))]);
 // Always include the correct answer among up to 4 visible options.
 const opts = shuffle([correct, ...others.slice(0, 3)]);
 const faceOrder = shuffle(FRUIT_FACES.map((_, i) => i));
 let face = 0;
 const nextFace = () => faceOrder[(face++) % faceOrder.length];

 const placeOne = (label, good, trap) => {
 let cell = this._emptyCell();
 if (!cell) {
 // Last resort: punch a hole in a non-spawn wall so the fruit is visible.
 for (let y = 1; y < GRID - 1 && !cell; y++) {
 for (let x = 1; x < GRID - 1 && !cell; x++) {
 const key = `${x},${y}`;
 if (this.snake.some((s) => s.x === x && s.y === y)) continue;
 if (this.fruits.some((f) => f.x === x && f.y === y)) continue;
 if (this.gnomes.some((g) => g.x === x && g.y === y)) continue;
 this.walls.delete(key);
 cell = { x, y };
 }
 }
 }
 if (!cell) return false;
 this.fruits.push({
 ...cell,
 label,
 good,
 trap,
 face: nextFace(),
 quizIdx: this.quizIdx,
 });
 return true;
 };

 for (const label of opts) {
 placeOne(label, label === correct, label !== correct);
 }
 // Extra decoy traps only if the board still has room.
 const trapBudget = Math.min(this.cfg.traps, Math.max(0, 2));
 for (let i = 0; i < trapBudget; i++) {
 if (!placeOne('???', false, true)) break;
 }
 // Guarantee the correct fruit exists even if earlier placement failed.
 if (!this.fruits.some((f) => f.good)) {
 placeOne(correct, true, false);
 }
 }

 _moveGnomes() {
 for (const g of this.gnomes) {
 g.step++;
 if (g.step % g.pace !== 0) continue;
 let nx = g.x + g.dir.x;
 let ny = g.y + g.dir.y;
 const blocked = (tx, ty) =>
 tx < 0 || ty < 0 || tx >= GRID || ty >= GRID ||
 this.walls.has(`${tx},${ty}`) ||
 this.snake.some((s) => s.x === tx && s.y === ty) ||
 this.fruits.some((f) => f.x === tx && f.y === ty) ||
 this.gnomes.some((o) => o !== g && o.x === tx && o.y === ty);
 if (blocked(nx, ny)) {
 const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
 g.dir = shuffle(dirs).find((d) => !blocked(g.x + d.x, g.y + d.y))
 || { x: -g.dir.x, y: -g.dir.y };
 nx = g.x + g.dir.x;
 ny = g.y + g.dir.y;
 }
 if (!blocked(nx, ny)) {
 g.x = nx; g.y = ny;
 }
 }
 }

 _tick() {
 if (!this.running) return;
 this.dir = this.nextDir;
 this._moveGnomes();
 const head = this.snake[0];
 const nx = head.x + this.dir.x;
 const ny = head.y + this.dir.y;

 if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID || this.walls.has(`${nx},${ny}`)) {
 this._hurt(t('hitBarrier'));
 return;
 }
 if (this.snake.some((s) => s.x === nx && s.y === ny)) {
 this._hurt(t('bitTail'));
 return;
 }
 if (this.gnomes.some((g) => g.x === nx && g.y === ny)) {
 this._hurt(t('gnomeGotYou'));
 return;
 }

 this.snake.unshift({ x: nx, y: ny });
 const fruit = this.fruits.find((f) => f.x === nx && f.y === ny);
 if (fruit) {
 this.fruits = this.fruits.filter((f) => f !== fruit);
 if (fruit.good) {
 this.score += 10 + this.stage;
 this.goodThisStage++;
 this._burst(nx, ny, '#86efac');
 this._report(true);
 this.quizIdx++;
 if (this.goodThisStage >= this.cfg.need) {
 this._stageClear();
 return;
 }
 // Fresh fruits for the new question only (clears leftover wrong answers).
 this._spawnFruits(true);
 this._updateHud();
 this._startReadSlowMo();
 } else {
 this._burst(nx, ny, '#f43f5e');
 this._report(false);
 this.snake.pop();
 this._hurt(t('wrongFruit'));
 return;
 }
 } else {
 this.snake.pop();
 }
 }

 _report(ok) {
 // Call while quizIdx still points at the challenge just answered.
 const q = this.quizzes[this.quizIdx % this.quizzes.length];
 try {
 if (ok) window.arborito?.xp?.(5);
 if (q?.challenge) window.arborito?.memory?.report?.(q.challenge, ok ? 4 : 1);
 } catch (_) {}
 }

 _hurt(reason) {
 this.lives--;
 this._burst(this.snake[0]?.x || 0, this.snake[0]?.y || 0, '#f43f5e');
 this._updateHud();
 if (this.lives <= 0) {
 this._end(false, reason);
 return;
 }
 this.snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
 this.dir = { x: 1, y: 0 };
 this.nextDir = { x: 1, y: 0 };
 this.tickAcc = 0;
 this._showBanner(`♥ ${reason}`);
 }

 _stageClear() {
 this.score += 25 * this.stage;
 if (this.stageInLesson >= this.stagesThisLesson) {
 if (this.sessionLessonIndex >= this.sessionLessonCap) {
 this._end(true, t('allClear'));
 return;
 }
 this.running = false;
 this.tickAcc = 0;
 this._showBanner(t('lessonClear'));
 if (this._stageTimer) clearTimeout(this._stageTimer);
 this._stageTimer = setTimeout(async () => {
 this._stageTimer = null;
 const ok = await this._loadLesson({ advance: true });
 if (!ok) {
 this._end(true, t('allClear'));
 return;
 }
 this.sessionLessonIndex++;
 this.stageInLesson = 1;
 this.stage++;
 this._beginStage();
 }, 900);
 return;
 }
 this.stage++;
 this.stageInLesson++;
 // Pause ticks during the intermission (do not leave the worm moving).
 this.running = false;
 this.tickAcc = 0;
 this._showBanner(`${t('stage')} ${this.stage}!`);
 if (this._stageTimer) clearTimeout(this._stageTimer);
 this._stageTimer = setTimeout(() => {
 this._stageTimer = null;
 this._beginStage();
 }, 700);
 }

 _end(won, msg) {
 this.running = false;
 this.wonLastRun = !!won;
 this._stopLoop();
 if (this._stageTimer) {
 clearTimeout(this._stageTimer);
 this._stageTimer = null;
 }
 document.getElementById('end-stars').textContent = won
 ? '★★★'
 : this.stage >= Math.ceil(this.totalStages * 0.55) ? '★★☆'
 : this.stage >= Math.ceil(this.totalStages * 0.25) ? '★☆☆' : '☆☆☆';
 document.getElementById('end-title').textContent = won ? t('winTitle') : t('loseTitle');
 document.getElementById('end-msg').textContent = t('endMsg', {
 score: this.score,
 stage: this.stage,
 total: this.totalStages,
 }) + (msg ? ` · ${msg}` : '');

 const btnNext = document.getElementById('btn-next');
 const btnRetry = document.getElementById('btn-retry');
 // Game over: only retry. Session win: offer another session from the playlist.
 if (btnNext) {
 btnNext.classList.toggle('hidden', !won);
 btnNext.textContent = t('nextLesson');
 if (won) {
 btnNext.classList.add('btn-primary');
 btnNext.classList.remove('btn-ghost');
 }
 }
 if (btnRetry) {
 btnRetry.textContent = t('retry');
 if (won) {
 btnRetry.classList.remove('btn-primary');
 btnRetry.classList.add('btn-ghost');
 } else {
 btnRetry.classList.add('btn-primary');
 btnRetry.classList.remove('btn-ghost');
 }
 }
 document.getElementById('end-screen').classList.remove('hidden');
 }

 _stopLoop() {
 if (this.timer) clearInterval(this.timer);
 this.timer = null;
 this.tickAcc = 0;
 this.lastFrameTs = 0;
 }

 _ensureRaf() {
 if (this._rafHandle) return;
 this._rafHandle = requestAnimationFrame((n) => this._raf(n));
 }

 _burst(gx, gy, color) {
 for (let i = 0; i < 14; i++) {
 this.particles.push({
 x: (gx + 0.5) * this.cell,
 y: (gy + 0.5) * this.cell,
 vx: (Math.random() - 0.5) * 6,
 vy: (Math.random() - 0.5) * 6,
 life: 20 + Math.random() * 15,
 color
 });
 }
 }

 _raf(ts = performance.now()) {
 this._rafHandle = 0;
 if (!this.lastFrameTs) this.lastFrameTs = ts;
 const dt = Math.min(64, ts - this.lastFrameTs);
 this.lastFrameTs = ts;
 this.pulse++;

 if (this.running) {
 this.tickAcc += dt;
 let guard = 0;
 while (guard++ < 5) {
 const interval = this._tickInterval();
 if (this.tickAcc < interval) break;
 this.tickAcc -= interval;
 this._tick();
 if (!this.running) break;
 }
 }

 this._draw();
 this.particles = this.particles.filter((p) => {
 p.x += p.vx; p.y += p.vy; p.life--; p.vy += 0.12;
 return p.life > 0;
 });
 if (this.running || this.particles.length) this._ensureRaf();
 }

 _drawFruitIcon(ctx, cx, cy, r, faceIdx) {
 const face = FRUIT_FACES[faceIdx % FRUIT_FACES.length];
 const grd = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.1, cx, cy, r);
 grd.addColorStop(0, face.spot);
 grd.addColorStop(1, face.body);
 ctx.fillStyle = grd;
 ctx.beginPath();
 ctx.arc(cx, cy, r, 0, Math.PI * 2);
 ctx.fill();
 // Leaf
 ctx.fillStyle = face.leaf;
 ctx.beginPath();
 ctx.ellipse(cx + r * 0.35, cy - r * 0.75, r * 0.38, r * 0.2, -0.6, 0, Math.PI * 2);
 ctx.fill();
 // Stem
 ctx.strokeStyle = '#365314';
 ctx.lineWidth = Math.max(1.5, r * 0.12);
 ctx.beginPath();
 ctx.moveTo(cx, cy - r * 0.55);
 ctx.lineTo(cx + r * 0.08, cy - r * 0.9);
 ctx.stroke();
 }

 _drawGnomeIcon(ctx, cx, cy, r, faceIdx) {
 const face = GNOME_FACES[faceIdx % GNOME_FACES.length];
 // Body
 ctx.fillStyle = '#334155';
 ctx.beginPath();
 ctx.ellipse(cx, cy + r * 0.35, r * 0.55, r * 0.45, 0, 0, Math.PI * 2);
 ctx.fill();
 // Head
 ctx.fillStyle = face.skin;
 ctx.beginPath();
 ctx.arc(cx, cy - r * 0.05, r * 0.38, 0, Math.PI * 2);
 ctx.fill();
 // Beard
 ctx.fillStyle = face.beard;
 ctx.beginPath();
 ctx.ellipse(cx, cy + r * 0.22, r * 0.36, r * 0.28, 0, 0, Math.PI * 2);
 ctx.fill();
 // Hat
 ctx.fillStyle = face.hat;
 ctx.beginPath();
 ctx.moveTo(cx - r * 0.55, cy - r * 0.15);
 ctx.lineTo(cx, cy - r * 1.15);
 ctx.lineTo(cx + r * 0.55, cy - r * 0.15);
 ctx.closePath();
 ctx.fill();
 // Eyes
 ctx.fillStyle = '#0f172a';
 ctx.beginPath();
 ctx.arc(cx - r * 0.12, cy - r * 0.08, r * 0.06, 0, Math.PI * 2);
 ctx.arc(cx + r * 0.12, cy - r * 0.08, r * 0.06, 0, Math.PI * 2);
 ctx.fill();
 }

 _draw() {
 const ctx = this.ctx;
 const c = this.cell;
 const W = this.canvas.width;
 const H = this.canvas.height;
 if (!W || !H || c < 1) return;

 const g = ctx.createLinearGradient(0, 0, W, H);
 g.addColorStop(0, '#1a140c');
 g.addColorStop(0.5, '#241a10');
 g.addColorStop(1, '#152218');
 ctx.fillStyle = g;
 ctx.fillRect(0, 0, W, H);

 for (let y = 0; y < GRID; y++) {
 for (let x = 0; x < GRID; x++) {
 if ((x + y) % 2 === 0) {
 ctx.fillStyle = 'rgba(52,211,153,0.04)';
 ctx.fillRect(x * c, y * c, c, c);
 }
 }
 }

 for (const key of this.walls) {
 const [x, y] = key.split(',').map(Number);
 const px = x * c, py = y * c;
 const hg = ctx.createLinearGradient(px, py, px, py + c);
 hg.addColorStop(0, '#14532d');
 hg.addColorStop(1, '#052e16');
 ctx.fillStyle = hg;
 ctx.fillRect(px + 1, py + 1, c - 2, c - 2);
 ctx.fillStyle = 'rgba(74,222,128,0.35)';
 ctx.fillRect(px + 3, py + 3, c - 6, 3);
 if (this.cfg.pattern === 'chaos' || this.cfg.pattern === 'maze') {
 ctx.fillStyle = '#78716c';
 ctx.beginPath();
 ctx.arc(px + c * 0.5, py + c * 0.55, c * 0.18, 0, Math.PI * 2);
 ctx.fill();
 }
 }

 for (const f of this.fruits) {
 const px = f.x * c, py = f.y * c;
 const bob = Math.sin((this.pulse + f.x * 7) / 8) * 2;
 // Same look for every answer fruit, no “correct” highlight until eaten.
 ctx.fillStyle = 'rgba(20, 30, 22, 0.78)';
 ctx.fillRect(px + 2, py + 2, c - 4, c - 4);
 // Labels may span ~2.4 cells so full quiz answers stay readable.
 const maxLabelW = Math.min(c * 2.4, this.canvas.width - 8);
 const maxSize = Math.max(10, Math.floor(c * 0.26));
 const minSize = Math.max(8, Math.floor(c * 0.16));
 const { lines, size: labelSize } = fitLabel(ctx, f.label, maxLabelW - 8, 4, maxSize, minSize);
 if (lines.length) {
 ctx.font = `bold ${labelSize}px system-ui,sans-serif`;
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 const lh = labelSize + 2;
 const padX = 5;
 const padY = 3;
 let textW = 0;
 for (const line of lines) textW = Math.max(textW, ctx.measureText(line).width);
 const plateW = Math.min(maxLabelW, textW + padX * 2);
 const plateH = lines.length * lh + padY * 2;
 let cx = px + c / 2;
 const halfW = plateW / 2;
 cx = Math.max(halfW + 2, Math.min(this.canvas.width - halfW - 2, cx));
 let plateTop = py + c * 0.52;
 if (plateTop + plateH > this.canvas.height - 2) {
 plateTop = Math.max(2, this.canvas.height - 2 - plateH);
 }
 ctx.fillStyle = 'rgba(6, 18, 12, 0.88)';
 ctx.beginPath();
 const pr = 4;
 const pl = cx - halfW;
 ctx.moveTo(pl + pr, plateTop);
 ctx.arcTo(pl + plateW, plateTop, pl + plateW, plateTop + plateH, pr);
 ctx.arcTo(pl + plateW, plateTop + plateH, pl, plateTop + plateH, pr);
 ctx.arcTo(pl, plateTop + plateH, pl, plateTop, pr);
 ctx.arcTo(pl, plateTop, pl + plateW, plateTop, pr);
 ctx.closePath();
 ctx.fill();
 ctx.fillStyle = '#ecfdf5';
 const textStartY = plateTop + padY + lh / 2;
 lines.forEach((line, i) => {
 ctx.fillText(line, cx, textStartY + i * lh);
 });
 }
 // Icon last so overlapping labels never hide the fruit itself.
 this._drawFruitIcon(ctx, px + c / 2, py + c * 0.28 + bob, c * 0.26, f.face ?? 0);
 }

 for (const gnm of this.gnomes) {
 const px = gnm.x * c, py = gnm.y * c;
 const wob = Math.sin((this.pulse + gnm.x * 3) / 5) * 1.5;
 ctx.fillStyle = 'rgba(244,63,94,0.2)';
 ctx.beginPath();
 ctx.arc(px + c / 2, py + c / 2, c * 0.42, 0, Math.PI * 2);
 ctx.fill();
 this._drawGnomeIcon(ctx, px + c / 2 + wob, py + c / 2, c * 0.36, gnm.face ?? 0);
 }

 this.snake.forEach((s, i) => {
 const px = s.x * c, py = s.y * c;
 const tt = i / Math.max(1, this.snake.length);
 const r = c * (0.42 - tt * 0.12);
 const grd = ctx.createRadialGradient(px + c / 2, py + c / 2, 2, px + c / 2, py + c / 2, r);
 grd.addColorStop(0, i === 0 ? '#6ee7b7' : '#34d399');
 grd.addColorStop(1, i === 0 ? '#059669' : '#047857');
 ctx.fillStyle = grd;
 ctx.beginPath();
 ctx.arc(px + c / 2, py + c / 2, r, 0, Math.PI * 2);
 ctx.fill();
 if (i === 0) {
 ctx.fillStyle = '#042f2e';
 const ex = this.dir.x !== 0 ? this.dir.x * c * 0.12 : c * 0.1;
 const ey = this.dir.y !== 0 ? this.dir.y * c * 0.12 : 0;
 ctx.beginPath();
 ctx.arc(px + c / 2 - ex * 0.3 + (this.dir.y !== 0 ? -c * 0.1 : 0), py + c / 2 + ey - c * 0.08, c * 0.07, 0, Math.PI * 2);
 ctx.arc(px + c / 2 + ex * 0.3 + (this.dir.y !== 0 ? c * 0.1 : 0), py + c / 2 + ey - c * 0.08, c * 0.07, 0, Math.PI * 2);
 ctx.fill();
 }
 });

 for (const p of this.particles) {
 ctx.globalAlpha = Math.max(0, p.life / 30);
 ctx.fillStyle = p.color;
 ctx.beginPath();
 ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
 ctx.fill();
 ctx.globalAlpha = 1;
 }

 const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.75);
 vg.addColorStop(0, 'rgba(0,0,0,0)');
 vg.addColorStop(1, 'rgba(0,0,0,0.45)');
 ctx.fillStyle = vg;
 ctx.fillRect(0, 0, W, H);

 // Soft read-time frame (no sin() strobe, that flickered the whole board).
 if (this.slowMoUntil && performance.now() < this.slowMoUntil) {
 const u = Math.min(1, (performance.now() - this.slowMoStart) / SLOW_MO_MS);
 const alpha = 0.14 * (1 - u);
 ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
 ctx.fillRect(0, 0, W, H);
 ctx.strokeStyle = `rgba(253, 224, 71, ${0.35 + 0.25 * (1 - u)})`;
 ctx.lineWidth = 3;
 ctx.strokeRect(3, 3, W - 6, H - 6);
 }
 }
}

const game = new WrongFruit();
game.boot();
