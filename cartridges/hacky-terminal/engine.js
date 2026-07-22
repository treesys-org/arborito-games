/**
 * Hacky Terminal, lesson drills as shell commands.
 * Static mode: menu-driven shell app; lessons, quizzes (all modes), code missions.
 * Dynamic mode: linear missions + AI tutor (unchanged).
 */

const QUIZ_MODES = {
 MULTIPLE: 'multiple',
 RECALL: 'recall',
 CLOZE: 'cloze',
 CHIPS: 'chips',
 STEPS: 'steps',
};

const translations = {
 EN: {
 START: 'BOOT TERMINAL',
 START_DESC:
 "Hacky Terminal v2.0 (static): menu shell with lessons.\nDynamic: missions + AI tutor.",
 LOADING: 'Loading lesson…',
 SCORE: 'Points',
 WELCOME: "Hacky Terminal v2.0: type 'menu' or 'help'.",
 HELP:
 'Commands: menu, lessons, play number, status, missions, hint, clear, help.\nExample: play 1\nIn a lesson: pick an option by number, or order chips by letter (a, b, c…), then done.',
 HELP_DYNAMIC:
 'Commands: help, clear, hint, missions.\nRun lesson commands to earn points. Ask the tutor anything.',
 MENU_TITLE: '═══ MAIN MENU ═══',
 MENU_1: '[1] List lessons in this module',
 MENU_2: '[2] Play next lesson with missions',
 MENU_3: '[3] Help',
 MENU_HINT: 'Type a number or command (e.g. lessons, play 1).',
 LESSONS_HEADER: 'Lessons in module:',
 LESSONS_EMPTY: 'No lessons in playlist.',
 LESSONS_HINT: 'Type play and the number: play 1',
 PLAY_USAGE: 'Type: play number Example: play 1 (see lessons)',
 PLAY_BAD: 'Invalid lesson number.',
 STATUS_IDLE: 'No active lesson. Type lessons or play 1.',
 STATUS_LESSON: 'Lesson {n}/{total}: {title}',
 STATUS_MISSION: 'Mission {m}/{mt}: {label}',
 READING: '── {title} ──',
 NO_MISSIONS:
 'No missions in this lesson. Read the material in Arborito, then: next | menu',
 MISSIONS_EMPTY: 'No missions in this lesson yet.',
 MISSION_HEADER: 'Missions:',
 MISSION_CURRENT: 'Mission {n}/{total}: try `{cmd}`',
 MISSION_QUIZ: 'Mission {n}/{total}: {label}',
 PICK_OPTION: 'Pick an option (number or text):',
 PICK_CHIP: '[{label}] {word}',
 ORDER_SO_FAR: 'Your order: {order}',
 ORDER_HINT: 'Type a letter to pick a chip, undo, or done.',
 ORDER_UNDO: 'undo = remove last chip',
 ORDER_DONE: 'done = submit order',
 HINT: 'Hint: try "{answer}"',
 HINT_TOPIC: 'Topic: {topic}',
 CLOSE: 'Almost! Expected: {answer}',
 CORRECT: 'Correct! +{pts}',
 WRONG: 'Unknown command. Type help or menu.',
 QUIZ_WRONG: 'Wrong answer.',
 CHECKING: 'Checking answer…',
 OFF_TOPIC: 'That is off-topic for this lesson. Try help or hint.',
 TUTOR_PERSONA:
 'You are a retro UNIX terminal tutor for this lesson. Reply in 1-3 short lines like shell output. Stay grounded in the lesson. No markdown or JSON.',
 LIFE_LOST: '−1 life.',
 LIVES_LEFT: '{n} lives left.',
 LIVES: 'Lives',
 DEFEAT_TITLE: 'OUT OF LIVES',
 DEFEAT_STATS: 'Score: {score} · Failed at mission {failed}/{total}',
 DEFEAT_LINE: 'Expected something like: {answer}',
 VICTORY: 'ALL MISSIONS DONE',
 VICTORY_TITLE: 'VICTORY',
 VICTORY_STATS: 'Score: {score} · {done}/{total} missions cleared',
 CONTINUE: 'NEXT LESSON',
 RETRY: 'TRY AGAIN',
 BACK_MENU: 'BACK TO MENU',
 NO_LESSON: 'No lessons with cuestionarios in this module.',
 SESSION_EMPTY: 'This module has no missions yet. Pick another topic on the map.',
 EXPLORE_MODE: 'Dynamic mode: ask anything about the lesson.',
 EXPLORE_HINT: 'No fixed missions here. Ask about the lesson or go to the next one.',
 MODE_STATIC: 'STATIC',
 MODE_DYNAMIC: 'DYNAMIC',
 SHELL_BANNER:
 '╔══════════════════════════════════════╗\n║ ARBORITO HACKY TERMINAL v2.0 ║\n║ STATIC SHELL MODE ║\n╚══════════════════════════════════════╝',
 },
 ES: {
 START: 'ARRANCAR TERMINAL',
 START_DESC:
 'Hacky Terminal v2.0: estático: shell con menú y lecciones.\nDinámico: misiones + tutor IA.',
 LOADING: 'Cargando lección…',
 SCORE: 'Puntos',
 WELCOME: "Hacky Terminal v2.0: escribe 'menu' o 'help'.",
 HELP:
 'Comandos: menu, lessons, play numero, status, missions, hint, clear, help.\nEjemplo: play 1\nEn lección: elige opción por número, o chips por letra (a, b, c…), luego done.',
 HELP_DYNAMIC:
 'Comandos: help, clear, hint, missions.\nEjecuta misiones. En modo IA puedes preguntar al tutor.',
 MENU_TITLE: '═══ MENÚ PRINCIPAL ═══',
 MENU_1: '[1] Ver lecciones del módulo',
 MENU_2: '[2] Siguiente lección con misiones',
 MENU_3: '[3] Ayuda',
 MENU_HINT: 'Escribe un número o comando (p. ej. lessons, play 1).',
 LESSONS_HEADER: 'Lecciones del módulo:',
 LESSONS_EMPTY: 'No hay lecciones en la lista.',
 LESSONS_HINT: 'Escribe play y el número: play 1',
 PLAY_USAGE: 'Escribe: play numero Ejemplo: play 1 (ver lessons)',
 PLAY_BAD: 'Número de lección inválido.',
 STATUS_IDLE: 'Sin lección activa. Escribe lessons o play 1.',
 STATUS_LESSON: 'Lección {n}/{total}: {title}',
 STATUS_MISSION: 'Misión {m}/{mt}: {label}',
 READING: '── {title} ──',
 NO_MISSIONS:
 'Sin misiones en esta lección. Lee el material en Arborito y luego: next | menu',
 MISSIONS_EMPTY: 'Esta lección aún no tiene misiones.',
 MISSION_HEADER: 'Misiones:',
 MISSION_CURRENT: 'Misión {n}/{total}: prueba `{cmd}`',
 MISSION_QUIZ: 'Misión {n}/{total}: {label}',
 PICK_OPTION: 'Elige una opción (número o texto):',
 PICK_CHIP: '[{label}] {word}',
 ORDER_SO_FAR: 'Tu orden: {order}',
 ORDER_HINT: 'Escribe una letra para elegir chip, undo o done.',
 ORDER_UNDO: 'undo = quitar último chip',
 ORDER_DONE: 'done = enviar orden',
 HINT: 'Pista: prueba "{answer}"',
 HINT_TOPIC: 'Tema: {topic}',
 CLOSE: 'Casi. Se esperaba: {answer}',
 CORRECT: '¡Correcto! +{pts}',
 WRONG: 'Comando desconocido. Escribe help o menu.',
 QUIZ_WRONG: 'Respuesta incorrecta.',
 CHECKING: 'Comprobando respuesta…',
 OFF_TOPIC: 'Eso no encaja con esta lección. Prueba help o hint.',
 TUTOR_PERSONA:
 'Eres un tutor UNIX retro para esta lección. Responde en 1-3 líneas cortas como salida de terminal. Cíñete a la lección. Sin markdown ni JSON.',
 LIFE_LOST: '−1 vida.',
 LIVES_LEFT: 'Quedan {n} vidas.',
 LIVES: 'Vidas',
 DEFEAT_TITLE: 'SIN VIDAS',
 DEFEAT_STATS: 'Puntuación: {score} · Fallaste en misión {failed}/{total}',
 DEFEAT_LINE: 'Se esperaba algo como: {answer}',
 VICTORY: 'MISIONES COMPLETAS',
 VICTORY_TITLE: 'VICTORIA',
 VICTORY_STATS: 'Puntuación: {score} · {done}/{total} misiones superadas',
 CONTINUE: 'SIGUIENTE LECCIÓN',
 RETRY: 'REPETIR',
 BACK_MENU: 'VOLVER AL MENÚ',
 NO_LESSON: 'No hay lecciones con cuestionario en este módulo.',
 SESSION_EMPTY: 'Este módulo aún no tiene misiones. Elige otro tema en el mapa.',
 EXPLORE_MODE: 'Modo dinámico: pregunta sobre la lección.',
 EXPLORE_HINT: 'Sin misiones fijas. Pregunta o pasa a la siguiente.',
 MODE_STATIC: 'ESTÁTICO',
 MODE_DYNAMIC: 'DINÁMICO',
 SHELL_BANNER:
 '╔══════════════════════════════════════╗\n║ ARBORITO HACKY TERMINAL v2.0 ║\n║ MODO SHELL ESTÁTICO ║\n╚══════════════════════════════════════╝',
 },
};

const lang =
 window.arborito?.user?.lang &&
 translations[window.arborito.user.lang.toUpperCase()]
 ? window.arborito.user.lang.toUpperCase()
 : 'EN';

function t(key, vars = {}) {
 let s = translations[lang][key] || translations.EN[key] || key;
 Object.entries(vars).forEach(([k, v]) => {
 s = s.replace(`{${k}}`, String(v));
 });
 return s;
}

function truncate(s, n = 96) {
 const text = String(s || '').trim();
 return text.length <= n ? text : `${text.slice(0, n - 1)}…`;
}

function missionLabel(task) {
 if (!task) return '…';
 if (task.kind === 'code') return task.label || task.prompt || task.accept?.[0] || '…';
 return task.label || task.prompt || task.question || '…';
}

function isDynamicMode() {
 return (
 window.arborito &&
 typeof window.arborito.getAIMode === 'function' &&
 window.arborito.getAIMode() === 'dynamic'
);
}

function isOrderingMode(mode) {
 return mode === QUIZ_MODES.CHIPS || mode === QUIZ_MODES.STEPS;
}

function isChoiceMode(mode) {
 return (
 mode === QUIZ_MODES.MULTIPLE ||
 mode === QUIZ_MODES.RECALL ||
 mode === QUIZ_MODES.CLOZE
);
}

const MAX_TASKS = 24;
const MAX_LIVES = 3;

/** Quiz modes that work in a text shell (cloze → nonsense distractors for shebangs). */
const TERMINAL_QUIZ_MODES = ['multiple', 'recall', 'chips', 'steps'];

function terminalTaskOpts(max = MAX_TASKS) {
 return { max, modes: TERMINAL_QUIZ_MODES };
}

function normalizeStrictAnswer(s) {
 return String(s || '')
 .trim()
 .toLowerCase()
 .replace(/\s+/g, ' ')
 .replace(/[“”«»]/g, '"')
 .replace(/[''`´]/g, "'")
 .replace(/[.,;:!?]+$/g, '');
}

function expectedOrderAnswer(task) {
 if (Array.isArray(task?.sequence) && task.sequence.length) {
 return task.sequence.join(' ');
 }
 return String(task?.accept?.[0] || '').trim();
}

function quizTaskMatchesStrict(player, task) {
 const answer = normalizeStrictAnswer(player);
 if (!answer || !task) return false;

 if (isOrderingMode(task.mode)) {
 return answer === normalizeStrictAnswer(expectedOrderAnswer(task));
 }

 if (isChoiceMode(task.mode)) {
 const expected = new Set(
 (task.accept || []).map((item) => normalizeStrictAnswer(item)).filter(Boolean)
);
 if (expected.has(answer)) return true;
 const options = task.options || [];
 const n = parseInt(player, 10);
 if (!Number.isNaN(n) && n >= 1 && n <= options.length) {
 return expected.has(normalizeStrictAnswer(options[n - 1]));
 }
 return false;
 }

 return false;
}

function sdk() {
 return window.arborito;
}

function terminalTutorPersona(task) {
 let persona = t('TUTOR_PERSONA');
 if (task && task.prompt) {
 persona += ` Current mission: "${truncate(task.prompt, 120)}".`;
 const expected = (task.accept || []).filter(Boolean).slice(0, 3).join(', ');
 if (expected) persona += ` Expected answers include: ${expected}.`;
 }
 return persona;
}

function branchProfile() {
 const arb = sdk();
 return {
 playerLang: lang.toLowerCase(),
 playerName: arb?.user?.username || 'Player',
 };
}

function cleanLessonActionOutput(aiRes) {
 if (!aiRes) return '';
 let out = String(aiRes.output || '').trim();
 if (!out) return '';
 if (out.startsWith('{') && out.includes('"output"')) {
 try {
 const parsed = JSON.parse(out);
 out = String(parsed.output || '').trim();
 } catch {
 /* keep raw */
 }
 }
 return out.replace(/^```[\s\S]*?```$/gm, '').trim();
}

function quizItemFromTask(task) {
 return {
 q: task.question || task.prompt || '',
 correct: task.accept?.[0] || task.output || '',
 topic: task.topic || '',
 };
}

function buildSessionFromLesson(lesson) {
 const arb = sdk();
 const tasks = arb?.challenge?.tasksFromLesson?.(lesson, terminalTaskOpts()) || [];
 const codeReplays = arb?.lesson?.codeReplays?.(lesson) || [];
 return {
 lesson,
 tasks,
 taskIndex: 0,
 explore: !tasks.length && isDynamicMode(),
 codeReplays,
 };
}

function enrichSession(s) {
 if (!s) return null;
 return Object.assign(s, {
 currentTask: s.tasks[s.taskIndex] || null,
 done: s.tasks.length > 0 && s.taskIndex >= s.tasks.length,
 });
}

class HackyTerminal {
 constructor() {
 this.session = null;
 this.score = 0;
 this.correctCount = 0;
 this.curriculum = [];
 this.lessonCursor = 0;
 this.shellState = 'menu';
 this.orderPicks = [];
 this.orderPool = [];
 this.orderIndexStack = [];
 this.orderChipLabels = [];
 this.lives = MAX_LIVES;

 this.outputEl = document.getElementById('term-output');
 this.inputEl = document.getElementById('term-input');
 this.missionEl = document.getElementById('mission-bar');
 this.scoreEl = document.getElementById('score-display');
 this.livesEl = document.getElementById('lives-display');
 this.topicEl = document.getElementById('lesson-topic');
 this.modeBadge = document.getElementById('mode-badge');
 this.form = document.getElementById('term-input-row');

 document.getElementById('score-label').textContent = t('SCORE');
 document.getElementById('lives-label').textContent = t('LIVES');
 document.getElementById('btn-start').textContent = t('START');
 document.getElementById('start-desc').textContent = t('START_DESC');
 document.getElementById('loading-text').textContent = t('LOADING');
 document.getElementById('term-prompt').textContent = '$';
 document.getElementById('term-title').textContent = 'alumno@arborito:~';

 document.getElementById('btn-start').addEventListener('click', () => this.boot());
 document.getElementById('btn-continue').addEventListener('click', () => this.nextLesson());
 document.getElementById('btn-retry').addEventListener('click', () => this.retry());
 document.getElementById('btn-defeat-retry').addEventListener('click', () => this.retry());
 const btnMenu = document.getElementById('btn-menu');
 if (btnMenu) btnMenu.addEventListener('click', () => this.backToMenu());
 const btnDefeatMenu = document.getElementById('btn-defeat-menu');
 if (btnDefeatMenu) btnDefeatMenu.addEventListener('click', () => this.backToMenu());
 this.form.addEventListener('submit', (ev) => {
 ev.preventDefault();
 void this.handleInput(this.inputEl.value);
 this.inputEl.value = '';
 });
 window.__hackyTerminal = this;
 this.updateLivesDisplay();
 }

 updateLivesDisplay() {
 if (!this.livesEl) return;
 const n = Math.max(0, Math.min(MAX_LIVES, Number(this.lives) || 0));
 this.livesEl.textContent = '♥'.repeat(n) + '♡'.repeat(MAX_LIVES - n);
 }

 resetLives() {
 this.lives = MAX_LIVES;
 this.updateLivesDisplay();
 }

 sdk() {
 return window.arborito;
 }

 updateModeBadge() {
 if (!this.modeBadge) return;
 const dynamic = isDynamicMode();
 this.modeBadge.textContent = dynamic ? t('MODE_DYNAMIC') : t('MODE_STATIC');
 this.modeBadge.classList.toggle('mode-badge--dynamic', dynamic);
 this.modeBadge.classList.toggle('mode-badge--static', !dynamic);
 }

 print(text, cls = 'term-line--out') {
 const div = document.createElement('div');
 div.className = `term-line ${cls}`;
 div.textContent = text;
 this.outputEl.appendChild(div);
 this.outputEl.scrollTop = this.outputEl.scrollHeight;
 }

 printCmd(line) {
 this.print(`$ ${line}`, 'term-line--cmd');
 }

 currentTask() {
 if (!this.session?.tasks?.length) return null;
 return this.session.tasks[this.session.taskIndex] || null;
 }

 updateMissionBar() {
 const s = this.session;
 if (!s) {
 this.missionEl.textContent = this.shellState === 'menu' ? t('MENU_TITLE') : t('STATUS_IDLE');
 return;
 }
 if (s.explore) {
 this.missionEl.textContent = t('EXPLORE_MODE');
 return;
 }
 const task = this.currentTask();
 if (!task) {
 this.missionEl.textContent = t('VICTORY');
 return;
 }
 const n = s.taskIndex + 1;
 const total = s.tasks.length;
 if (task.kind === 'code') {
 this.missionEl.textContent = t('MISSION_CURRENT', {
 n,
 total,
 cmd: missionLabel(task),
 });
 } else {
 this.missionEl.textContent = t('MISSION_QUIZ', {
 n,
 total,
 label: truncate(missionLabel(task), 72),
 });
 }
 }

 listMissions() {
 const s = this.session;
 if (!s?.tasks?.length) {
 this.print(t('MISSIONS_EMPTY'), 'term-line--hint');
 return;
 }
 this.print(t('MISSION_HEADER'), 'term-line--sys');
 s.tasks.forEach((task, i) => {
 const marker = i === s.taskIndex ? '-> ' : ' ';
 const label = missionLabel(task);
 this.print(`${marker}${label}`, i === s.taskIndex ? 'term-line--hint' : 'term-line--out');
 });
 }

 showMainMenu() {
 this.shellState = 'menu';
 this.print(t('MENU_TITLE'), 'term-line--sys');
 this.print(t('MENU_1'), 'term-line--out');
 this.print(t('MENU_2'), 'term-line--out');
 this.print(t('MENU_3'), 'term-line--out');
 this.print(t('MENU_HINT'), 'term-line--hint');
 this.topicEl.textContent = '';
 this.updateMissionBar();
 }

 listLessons() {
 if (!this.curriculum.length) {
 this.print(t('LESSONS_EMPTY'), 'term-line--err');
 return;
 }
 this.print(t('LESSONS_HEADER'), 'term-line--sys');
 this.curriculum.forEach((item, i) => {
 const title = truncate(item.title || item.name || `#${i + 1}`, 64);
 this.print(` ${i + 1}. ${title}`, 'term-line--out');
 });
 this.print(t('LESSONS_HINT'), 'term-line--hint');
 }

 applySession(snapshot, lessonIndex = -1) {
 if (!snapshot) return false;
 this.session = snapshot;
 this.orderPicks = [];
 this.orderPool = [];
 this.orderIndexStack = [];
 this.orderChipLabels = [];
 this.resetLives();
 if (lessonIndex >= 0) this.lessonCursor = lessonIndex;
 this.shellState = 'lesson';
 this.outputEl.innerHTML = '';
 this.topicEl.textContent = String(snapshot.lesson?.title || '').slice(0, 80);
 this.updateModeBadge();
 this.updateMissionBar();
 this.print(t('READING', { title: snapshot.lesson?.title || '…' }), 'term-line--sys');
 if (!snapshot.explore && snapshot.tasks?.length) {
 this.printMissionPrompt(this.currentTask());
 } else if (snapshot.explore) {
 this.print(t('EXPLORE_HINT'), 'term-line--hint');
 } else {
 this.print(t('NO_MISSIONS'), 'term-line--hint');
 }
 return true;
 }

 initOrderState(task) {
 this.orderPicks = [];
 this.orderIndexStack = [];
 this.orderPool =
 Array.isArray(task?.chips) && task.chips.length ? [...task.chips] : [];
 if (!this.orderPool.length && Array.isArray(task?.sequence)) {
 this.orderPool = [...task.sequence];
 }
 this.orderChipLabels = this.orderPool.map((_, i) =>
 i < 26 ? String.fromCharCode(97 + i) : String(i + 1)
);
 }

 isQuizTask(task) {
 return !!(
 task &&
 (task.kind === 'quiz' || isChoiceMode(task.mode) || isOrderingMode(task.mode))
);
 }

 setTerminalInputEnabled(enabled) {
 if (this.inputEl) this.inputEl.disabled = !enabled;
 }

 hideEndScreens() {
 document.getElementById('victory-screen')?.classList.add('hidden');
 document.getElementById('defeat-screen')?.classList.add('hidden');
 this.setTerminalInputEnabled(true);
 }

 printMissionPrompt(task) {
 if (!task) return;
 const q = task.question || task.prompt || missionLabel(task);
 this.print(q, 'term-line--out');
 if (task.clozeDisplay && task.mode === QUIZ_MODES.CLOZE) {
 this.print(task.clozeDisplay, 'term-line--hint');
 }
 if (isChoiceMode(task.mode) && Array.isArray(task.options) && task.options.length) {
 this.print(t('PICK_OPTION'), 'term-line--hint');
 task.options.forEach((opt, i) => {
 this.print(` ${i + 1}) ${opt}`, 'term-line--out');
 });
 return;
 }
 if (isOrderingMode(task.mode)) {
 this.initOrderState(task);
 this.printOrderState();
 return;
 }
 if (task.kind === 'code') {
 this.print(`$ ${missionLabel(task)}`, 'term-line--hint');
 }
 }

 repromptCurrentTask() {
 const task = this.currentTask();
 if (!task) return;
 if (isChoiceMode(task.mode) && Array.isArray(task.options) && task.options.length) {
 this.print(t('PICK_OPTION'), 'term-line--hint');
 task.options.forEach((opt, i) => {
 this.print(` ${i + 1}) ${opt}`, 'term-line--out');
 });
 return;
 }
 if (isOrderingMode(task.mode)) {
 this.initOrderState(task);
 this.printOrderState();
 return;
 }
 this.printMissionPrompt(task);
 }

 resolveChoiceInput(raw, task) {
 const options = task.options || [];
 const n = parseInt(raw, 10);
 if (!Number.isNaN(n) && n >= 1 && n <= options.length) {
 return options[n - 1];
 }
 return raw;
 }

 printOrderState() {
 this.orderPool.forEach((word, idx) => {
 if (this.orderIndexStack.includes(idx)) return;
 const label = this.orderChipLabels[idx] || String(idx + 1);
 this.print(t('PICK_CHIP', { label, word }), 'term-line--out');
 });
 if (this.orderPicks.length) {
 this.print(t('ORDER_SO_FAR', { order: this.orderPicks.join(' ') }), 'term-line--hint');
 }
 this.print(t('ORDER_HINT'), 'term-line--hint');
 }

 resolveOrderPick(raw) {
 const lower = raw.toLowerCase();
 if (lower === 'undo') {
 if (!this.orderPicks.length) return null;
 const lastIdx = this.orderIndexStack.pop();
 if (lastIdx !== undefined) this.orderPicks.pop();
 this.printOrderState();
 return null;
 }
 if (lower === 'done') {
 return this.orderPicks.join(' ');
 }
 if (/^[a-z]$/.test(lower)) {
 const idx = this.orderChipLabels.findIndex(
 (label, i) => label.toLowerCase() === lower && !this.orderIndexStack.includes(i)
);
 if (idx >= 0) {
 this.orderIndexStack.push(idx);
 this.orderPicks.push(this.orderPool[idx]);
 this.printOrderState();
 return null;
 }
 }
 const n = parseInt(raw, 10);
 if (!Number.isNaN(n) && n >= 1 && n <= this.orderPool.length) {
 const idx = n - 1;
 if (this.orderIndexStack.includes(idx)) return null;
 this.orderIndexStack.push(idx);
 this.orderPicks.push(this.orderPool[idx]);
 this.printOrderState();
 return null;
 }
 return raw;
 }

 async boot() {
 const loading = document.getElementById('loading-state');
 const btn = document.getElementById('btn-start');
 loading.classList.remove('hidden');
 btn.classList.add('hidden');
 this.updateModeBadge();
 try {
 if (!window.arborito) throw new Error('no sdk');
 if (isDynamicMode()) {
 const arb = sdk();
 if (arb?.ai) arb.ai.persona = t('TUTOR_PERSONA');
 await this.bootDynamic();
 } else {
 await this.bootStatic();
 }
 document.getElementById('start-screen').classList.add('hidden');
 document.getElementById('app').classList.remove('hidden');
 this.inputEl.focus();
 } catch (err) {
 loading.classList.add('hidden');
 btn.classList.remove('hidden');
 document.getElementById('start-desc').textContent =
 err?.message === 'session empty' ? t('SESSION_EMPTY') : t('NO_LESSON');
 }
 }

 async bootDynamic() {
 const arb = sdk();
 if (!arb?.lesson) throw new Error('no sdk');
 let first = null;
 try {
 first = await arb.lesson.next();
 } catch {
 first = await arb.lesson.at(0);
 }
 const hit = await arb.lesson.findWithTasks?.(first, {
 requireTasks: true,
 maxTasks: MAX_TASKS,
 });
 const lesson = hit?.lesson || first;
 if (!lesson) throw new Error('session empty');
 this.session = buildSessionFromLesson(lesson);
 if (!this.session.tasks.length && !isDynamicMode()) {
 throw new Error('session empty');
 }
 this.curriculum = arb.lesson.list?.() || [];
 this.shellState = 'lesson';
 this.score = 0;
 this.correctCount = 0;
 this.scoreEl.textContent = '0';
 this.applySession(enrichSession(this.session));
 this.print(t('WELCOME'), 'term-line--sys');
 }

 async bootStatic() {
 const arb = sdk();
 this.curriculum = arb?.lesson?.list?.() || [];
 if (!this.curriculum.length) throw new Error('session empty');
 this.score = 0;
 this.correctCount = 0;
 this.scoreEl.textContent = '0';
 this.outputEl.innerHTML = '';
 this.shellState = 'menu';
 this.print(t('SHELL_BANNER'), 'term-line--sys');
 this.print(t('WELCOME'), 'term-line--sys');
 this.showMainMenu();
 }

 async startLessonAt(index) {
 const lesson = await sdk().lesson.at(index);
 if (!lesson) return false;
 this.session = buildSessionFromLesson(lesson);
 this.applySession(enrichSession(this.session), index);
 return true;
 }

 async playNextWithMissions() {
 const total = this.curriculum.length;
 for (let i = 0; i < total; i++) {
 const idx = (this.lessonCursor + i) % total;
 const lesson = await window.arborito.lesson.at(idx);
 if (!lesson) continue;
 const tasks =
 window.arborito.challenge?.tasksFromLesson?.(lesson, terminalTaskOpts()) || [];
 if (tasks.length) {
 this.lessonCursor = idx;
 await this.startLessonAt(idx);
 return true;
 }
 }
 this.print(t('SESSION_EMPTY'), 'term-line--err');
 return false;
 }

 async handleStaticInput(line) {
 const raw = String(line || '').trim();
 if (!raw) return;
 const lower = raw.toLowerCase();

 if (this.shellState === 'menu') {
 if (lower === 'help' || lower === '3') {
 this.print(t('HELP'), 'term-line--out');
 return;
 }
 if (lower === 'menu' || lower === 'm') {
 this.showMainMenu();
 return;
 }
 if (lower === 'lessons' || lower === 'ls' || lower === '1') {
 this.listLessons();
 return;
 }
 if (lower === '2') {
 await this.playNextWithMissions();
 return;
 }
 if (lower === 'clear') {
 this.outputEl.innerHTML = '';
 this.showMainMenu();
 return;
 }
 if (lower === 'status') {
 this.print(
 this.session
 ? t('STATUS_LESSON', {
 n: this.lessonCursor + 1,
 total: this.curriculum.length,
 title: this.session.lesson?.title || '',
 })
 : t('STATUS_IDLE'),
 'term-line--out'
);
 return;
 }
 const playMatch = lower.match(/^play\s+(\d+)$/);
 if (playMatch) {
 const idx = parseInt(playMatch[1], 10) - 1;
 if (idx < 0 || idx >= this.curriculum.length) {
 this.print(t('PLAY_BAD'), 'term-line--err');
 return;
 }
 await this.startLessonAt(idx);
 return;
 }
 if (/^\d+$/.test(lower)) {
 const idx = parseInt(lower, 10) - 1;
 if (idx >= 0 && idx < this.curriculum.length) {
 await this.startLessonAt(idx);
 return;
 }
 }
 this.print(t('WRONG'), 'term-line--err');
 return;
 }

 if (lower === 'menu' || lower === 'exit') {
 this.backToMenu();
 return;
 }
 if (lower === 'help') {
 this.print(t('HELP'), 'term-line--out');
 return;
 }
 if (lower === 'clear') {
 this.outputEl.innerHTML = '';
 this.print(t('READING', { title: this.session?.lesson?.title || '' }), 'term-line--sys');
 this.printMissionPrompt(this.currentTask());
 return;
 }
 if (lower === 'missions') {
 this.listMissions();
 return;
 }
 if (lower === 'status') {
 const task = this.currentTask();
 this.print(
 task
 ? t('STATUS_MISSION', {
 m: (this.session?.taskIndex || 0) + 1,
 mt: this.session?.tasks?.length || 0,
 label: truncate(missionLabel(task), 48),
 })
 : t('VICTORY'),
 'term-line--out'
);
 return;
 }
 if (lower === 'hint' || raw === '?') {
 const task = this.currentTask();
 if (!task) {
 this.print(t('MISSIONS_EMPTY'), 'term-line--hint');
 return;
 }
 this.print(t('HINT', { answer: truncate(task.accept?.[0] || task.output) }), 'term-line--hint');
 if (task.topic) this.print(t('HINT_TOPIC', { topic: task.topic }), 'term-line--hint');
 return;
 }
 if (lower === 'next' && !this.session?.tasks?.length) {
 await this.nextLesson();
 return;
 }

 const task = this.currentTask();
 if (!task) {
 if (lower === 'next') await this.nextLesson();
 else this.print(t('NO_MISSIONS'), 'term-line--hint');
 return;
 }

 let submitText = raw;
 if (isChoiceMode(task.mode) && task.options?.length) {
 submitText = this.resolveChoiceInput(raw, task);
 } else if (isOrderingMode(task.mode)) {
 const resolved = this.resolveOrderPick(raw);
 if (resolved === null) return;
 submitText = resolved;
 }

 await this.submitAnswer(submitText);
 }

 async handleInput(line) {
 const raw = String(line || '').trim();
 if (!raw) return;
 this.printCmd(raw);

 if (!isDynamicMode()) {
 await this.handleStaticInput(raw);
 return;
 }

 const lower = raw.toLowerCase();
 if (lower === 'help') {
 this.print(t('HELP_DYNAMIC'), 'term-line--out');
 return;
 }
 if (lower === 'clear') {
 this.outputEl.innerHTML = '';
 this.print(t('WELCOME'), 'term-line--sys');
 return;
 }
 if (lower === 'missions') {
 this.listMissions();
 return;
 }
 if (lower === 'hint' || raw === '?') {
 if (this.session?.explore) {
 this.print(t('EXPLORE_HINT'), 'term-line--hint');
 return;
 }
 const task = this.currentTask();
 if (!task) {
 this.print(t('MISSIONS_EMPTY'), 'term-line--hint');
 return;
 }
 this.print(t('HINT', { answer: truncate(task.accept?.[0] || task.output) }), 'term-line--hint');
 if (task.topic) this.print(t('HINT_TOPIC', { topic: task.topic }), 'term-line--hint');
 return;
 }

 await this.submitAnswer(raw);
 }

 async submitAnswer(raw) {
 const s = this.session;
 if (!s) return;
 const arb = sdk();
 const trimmed = String(raw || '').trim();
 if (!trimmed) return;

 const task = s.tasks[s.taskIndex] || null;
 const matchesAny = arb?.quiz?.matchesAny;

 if (task && this.isQuizTask(task)) {
 if (quizTaskMatchesStrict(trimmed, task)) {
 s.taskIndex += 1;
 this.onMissionCorrect(task);
 return;
 }
 if (matchesAny?.(trimmed, task.accept)?.ok) {
 s.taskIndex += 1;
 this.onMissionCorrect(task);
 return;
 }
 if (!isDynamicMode()) {
 if (isChoiceMode(task.mode)) {
 const playerNorm = normalizeStrictAnswer(trimmed);
 for (const exp of task.accept || []) {
 const expectedNorm = normalizeStrictAnswer(exp);
 if (
 playerNorm.length > 2 &&
 expectedNorm.length > playerNorm.length &&
 expectedNorm.includes(playerNorm) &&
 playerNorm !== expectedNorm
) {
 this.print(t('CLOSE', { answer: truncate(exp) }), 'term-line--hint');
 this.loseQuizLife(task);
 return;
 }
 }
 }
 this.loseQuizLife(task);
 return;
 }
 if (arb?.quiz?.gradeAnswer && s.lesson) {
 this.print(t('CHECKING'), 'term-line--hint');
 try {
 const ok = await arb.quiz.gradeAnswer(
 s.lesson,
 quizItemFromTask(task),
 trimmed,
 { profile: branchProfile() }
);
 if (ok) {
 s.taskIndex += 1;
 this.onMissionCorrect(task);
 return;
 }
 } catch {
 /* fall through to life loss */
 }
 }
 this.loseQuizLife(task);
 return;
 }

 if (task && matchesAny?.(trimmed, task.accept)?.ok) {
 s.taskIndex += 1;
 this.onMissionCorrect(task);
 return;
 }

 const replay = arb?.quiz?.findCodeReplay?.(trimmed, s.codeReplays);
 if (replay) {
 let advanced = false;
 if (task && task.kind === 'code' && matchesAny?.(trimmed, task.accept)?.ok) {
 s.taskIndex += 1;
 advanced = true;
 }
 this.print(replay.replay.output, 'term-line--out');
 if (advanced) this.onMissionCorrect(task);
 return;
 }

 if (isDynamicMode() && arb?.ask?.lessonAction) {
 try {
 const aiRes = await arb.ask.lessonAction(s.lesson, trimmed, {
 persona: terminalTutorPersona(task),
 profile: branchProfile(),
 });
 const out = cleanLessonActionOutput(aiRes);
 let advanced = false;
 if (task && matchesAny?.(trimmed, task.accept)?.ok) {
 s.taskIndex += 1;
 advanced = true;
 }
 if (advanced) {
 this.onMissionCorrect(task);
 return;
 }
 if (task && this.isQuizTask(task)) {
 if (out) this.print(out, 'term-line--out');
 this.loseQuizLife(task);
 return;
 }
 if (!out) {
 this.print(t('WRONG'), 'term-line--err');
 return;
 }
 this.print(out, 'term-line--out');
 return;
 } catch {
 if (task && this.isQuizTask(task)) {
 this.loseQuizLife(task);
 return;
 }
 this.print(t('WRONG'), 'term-line--err');
 return;
 }
 }

 this.print(t('WRONG'), 'term-line--err');
 }

 loseQuizLife(task) {
 this.print(t('QUIZ_WRONG'), 'term-line--err');
 this.lives = Math.max(0, (Number(this.lives) || 0) - 1);
 this.updateLivesDisplay();
 this.print(t('LIFE_LOST'), 'term-line--err');
 if (this.lives <= 0) {
 const expected = task?.accept?.[0] || task?.output || '';
 if (expected) {
 this.print(t('DEFEAT_LINE', { answer: truncate(expected) }), 'term-line--hint');
 }
 this.showDefeat();
 return;
 }
 this.print(t('LIVES_LEFT', { n: this.lives }), 'term-line--hint');
 this.repromptCurrentTask();
 }

 onMissionCorrect(taskOrExtra) {
 this.score += 10;
 this.correctCount += 1;
 this.scoreEl.textContent = String(this.score);
 this.print(t('CORRECT', { pts: 10 }), 'term-line--sys');
 const extra =
 taskOrExtra && typeof taskOrExtra === 'object' && taskOrExtra.kind === 'code'
 ? taskOrExtra.output
 : typeof taskOrExtra === 'string'
 ? taskOrExtra
 : '';
 if (extra) this.print(extra, 'term-line--out');
 enrichSession(this.session);
 this.orderPicks = [];
 this.orderPool = [];
 this.orderIndexStack = [];
 this.orderChipLabels = [];
 this.updateMissionBar();
 const done = this.session && this.session.taskIndex >= (this.session.tasks?.length || 0);
 if (done) {
 this.showVictory();
 return;
 }
 const next = this.currentTask();
 if (next) this.printMissionPrompt(next);
 }

 showVictory() {
 this.hideEndScreens();
 document.getElementById('victory-title').textContent = t('VICTORY_TITLE');
 document.getElementById('victory-stats').textContent = t('VICTORY_STATS', {
 score: this.score,
 done: this.correctCount,
 total: this.session?.tasks?.length || 0,
 });
 document.getElementById('btn-continue').textContent = isDynamicMode()
 ? t('CONTINUE')
 : t('CONTINUE');
 document.getElementById('btn-retry').textContent = t('RETRY');
 const btnMenu = document.getElementById('btn-menu');
 if (btnMenu) btnMenu.textContent = t('BACK_MENU');
 document.getElementById('victory-screen').classList.remove('hidden');
 this.setTerminalInputEnabled(false);
 }

 showDefeat() {
 this.hideEndScreens();
 const failedAt = (this.session?.taskIndex || 0) + 1;
 document.getElementById('defeat-title').textContent = t('DEFEAT_TITLE');
 document.getElementById('defeat-stats').textContent = t('DEFEAT_STATS', {
 score: this.score,
 failed: failedAt,
 total: this.session?.tasks?.length || 0,
 });
 document.getElementById('btn-defeat-retry').textContent = t('RETRY');
 document.getElementById('btn-defeat-menu').textContent = t('BACK_MENU');
 document.getElementById('defeat-screen').classList.remove('hidden');
 this.setTerminalInputEnabled(false);
 }

 backToMenu() {
 this.hideEndScreens();
 this.session = null;
 this.lives = 0;
 this.updateLivesDisplay();
 this.orderPicks = [];
 this.shellState = 'menu';
 this.outputEl.innerHTML = '';
 this.print(t('SHELL_BANNER'), 'term-line--sys');
 this.showMainMenu();
 this.inputEl.focus();
 }

 async nextLesson() {
 this.hideEndScreens();
 if (!isDynamicMode()) {
 this.lessonCursor = (this.lessonCursor + 1) % Math.max(1, this.curriculum.length);
 const ok = await this.playNextWithMissions();
 if (!ok) this.backToMenu();
 return;
 }
 const arb = sdk();
 const hit = await arb.lesson.findWithTasks?.(null, {
 requireTasks: false,
 maxTasks: MAX_TASKS,
 });
 if (!hit?.lesson) {
 this.print(t('SESSION_EMPTY'), 'term-line--err');
 return;
 }
 this.session = buildSessionFromLesson(hit.lesson);
 this.score = 0;
 this.correctCount = 0;
 this.scoreEl.textContent = '0';
 this.applySession(enrichSession(this.session));
 }

 retry() {
 this.hideEndScreens();
 if (!this.session?.lesson) return;
 this.session = buildSessionFromLesson(this.session.lesson);
 this.orderPicks = [];
 this.applySession(enrichSession(this.session), this.lessonCursor);
 }
}

new HackyTerminal();

function waitForArboritoSdk(maxMs = 20000) {
 return new Promise((resolve) => {
 if (window.arborito?.lesson && window.arborito?.challenge) {
 resolve(true);
 return;
 }
 const start = Date.now();
 const tick = () => {
 if (window.arborito?.lesson && window.arborito?.challenge) {
 resolve(true);
 return;
 }
 if (Date.now() - start >= maxMs) {
 resolve(false);
 return;
 }
 setTimeout(tick, 40);
 };
 tick();
 });
}

void (async () => {
 const term = window.__hackyTerminal;
 if (!term) return;
 const ready = await waitForArboritoSdk();
 if (!ready) return;
 if (!isDynamicMode()) {
 void term.boot();
 }
})();
