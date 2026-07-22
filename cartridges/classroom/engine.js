import { SpriteGen, Colors } from './assets.js';

/* Platform helpers come from the SDK (window.arborito.platform.*).
 * Aliased so the rest of the file keeps its existing names. */
const _platform = (window.arborito && window.arborito.platform) || {};
const bindMobileTap = _platform.onTap || (() => () => {});
const initViewportListeners = _platform.onScreenChange || (() => () => {});

const translations = {
 EN: {
 START_CLASS: "START CLASS",
 START_DESC_STATIC: "Evaluate your classmates.\nPick your answers.\nWin the ranking.",
 START_DESC_DYNAMIC: "Evaluate your classmates.\nWrite your answers.\nWin the ranking.",
 LOADING: "Settling in to class...",
 LOADING_STATIC: "Settling in to class...",
 NEW_TOPIC: "Alright class, new topic: ",
 ASK_PLAYER: "You! {question} Answer me.",
 CORRECT: "CORRECT!",
 GOOD_JOB: `Exactly. "{answer}". Good job.`,
 WRONG: "WRONG!",
 INCORRECT: `Incorrect. I was looking for "{answer}".`,
 ACCEPTED: "GOOD!",
 WELL_SPOTTED: "Well spotted. Correct.",
 OBJECTION: "BAD!",
 STUDENT_WAS_CORRECT: `No! {name} was correct.`,
 PAY_ATTENTION: `Pay attention! That was wrong.`,
 DISMISSED: "CLASS DISMISSED",
 FINAL_TALLY: `Final tally. You scored {score} points. We will review another topic next.`,
 SYSTEM_FAILURE: "Class is quiet today. Try this lesson again later.",
 SYSTEM_FAILURE_STATIC: "Class is quiet today. Try this lesson again later.",
 SYSTEM_FAILURE_AI: "Class is quiet today. Try this lesson again later.",
 RANK: "CLASS RANK",
 TOPICS: "CLASS TOPICS:",
 TYPE_ANSWER: "TYPE ANSWER...",
 EVALUATING: "Checking answer…",
 SUBMIT: "SUBMIT",
 JUDGE_CORRECT: "✅ CORRECT",
 JUDGE_WRONG: "❌ WRONG",
 UNKNOWN_SPEAKER: "???",
 NEXT_BTN: "NEXT ▶",
 CHOOSE_OPTION: "Choose an answer:",
 RULES_TITLE: "CLASS SYLLABUS",
 RULE_1: "JUDGE your classmates (Correct vs Incorrect).",
 RULE_2_STATIC: "PICK the answer when the Teacher asks YOU.",
 RULE_2_DYNAMIC: "TYPE the answer when the Teacher asks YOU.",
 RULE_3: "SCORE points to top the ranking.",
 BTN_READY: "I UNDERSTAND",
 ROUND_LABEL: "Round {current}/{total}",
 STREAK_BONUS: "Streak x{streak}! +{bonus}",
 VICTORY_TITLE: "CLASS DISMISSED",
 VICTORY_STATS: "Score: {score} ★ · {correct}/{total} correct · Best streak {bestStreak}",
 VICTORY_RANK: "You placed #{rank} in class: {grade}",
 GRADE_A: "Outstanding!",
 GRADE_B: "Good work!",
 GRADE_C: "Keep studying",
 GRADE_D: "Needs more practice",
 BTN_NEW_CLASS: "Next class",
 BTN_SESSION_DONE: "Session complete",
 CLASS_NUMBER: "Class #{n}",
 SESSION_LABEL: "Session {n}/{max}",
 BOARD_WIPING: "Let me erase the board…"
 },
 ES: {
 START_CLASS: "EMPEZAR CLASE",
 START_DESC_STATIC: "Evalúa a tus compañeros.\nElige tus respuestas.\nGana el ranking.",
 START_DESC_DYNAMIC: "Evalúa a tus compañeros.\nEscribe tus respuestas.\nGana el ranking.",
 LOADING: "Tomando asiento en clase...",
 LOADING_STATIC: "Tomando asiento en clase...",
 NEW_TOPIC: "Bien clase, nuevo tema: ",
 ASK_PLAYER: "¡Tú! {question} Contesta.",
 CORRECT: "¡CORRECTO!",
 GOOD_JOB: `Exacto. "{answer}". Buen trabajo.`,
 WRONG: "¡INCORRECTO!",
 INCORRECT: `Incorrecto. La respuesta era "{answer}".`,
 ACCEPTED: "¡BIEN!",
 WELL_SPOTTED: "Bien visto. Correcto.",
 OBJECTION: "¡MAL!",
 STUDENT_WAS_CORRECT: `¡No! {name} tenía razón.`,
 PAY_ATTENTION: `¡Presta atención! Eso era incorrecto.`,
 DISMISSED: "CLASE TERMINADA",
 FINAL_TALLY: `Recuento final. Tienes {score} puntos. Repasaremos otro tema la próxima vez.`,
 SYSTEM_FAILURE: "Hoy la clase está en silencio. Vuelve más tarde a esta lección.",
 SYSTEM_FAILURE_STATIC: "Hoy la clase está en silencio. Vuelve más tarde a esta lección.",
 SYSTEM_FAILURE_AI: "Hoy la clase está en silencio. Vuelve más tarde a esta lección.",
 RANK: "RANKING",
 TOPICS: "TEMAS DE CLASE:",
 TYPE_ANSWER: "ESCRIBE RESPUESTA...",
 EVALUATING: "Comprobando respuesta…",
 SUBMIT: "ENVIAR",
 JUDGE_CORRECT: "✅ CORRECTO",
 JUDGE_WRONG: "❌ INCORRECTO",
 UNKNOWN_SPEAKER: "???",
 NEXT_BTN: "SIGUIENTE ▶",
 CHOOSE_OPTION: "Elige una respuesta:",
 RULES_TITLE: "SILABARIO DE CLASE",
 RULE_1: "JUZGA a tus compañeros (Correcto vs Incorrecto).",
 RULE_2_STATIC: "ELIGE la respuesta cuando el Profesor te pregunte.",
 RULE_2_DYNAMIC: "ESCRIBE la respuesta cuando el Profesor te pregunte.",
 RULE_3: "GANA puntos para liderar el ranking.",
 BTN_READY: "ENTENDIDO",
 ROUND_LABEL: "Ronda {current}/{total}",
 STREAK_BONUS: "¡Racha x{streak}! +{bonus}",
 VICTORY_TITLE: "CLASE TERMINADA",
 VICTORY_STATS: "Puntuación: {score} ★ · {correct}/{total} aciertos · Mejor racha {bestStreak}",
 VICTORY_RANK: "Quedaste #{rank} en clase: {grade}",
 GRADE_A: "¡Sobresaliente!",
 GRADE_B: "¡Buen trabajo!",
 GRADE_C: "Sigue estudiando",
 GRADE_D: "Necesitas más práctica",
 BTN_NEW_CLASS: "Siguiente clase",
 BTN_SESSION_DONE: "Sesión completa",
 CLASS_NUMBER: "Clase #{n}",
 SESSION_LABEL: "Sesión {n}/{max}",
 BOARD_WIPING: "Voy a borrar la pizarra…"
 }
};

/** Keep in sync with meta.json : shown on the start menu. */
const CARTRIDGE_VERSION = '1.0.0';

const lang = (window.arborito && window.arborito.user && translations[window.arborito.user.lang.toUpperCase()]) ? window.arborito.user.lang.toUpperCase() : 'EN';
const classroomStaticMode = !!(window.arborito && typeof window.arborito.getAIMode === 'function' && window.arborito.getAIMode() === 'static');
document.getElementById('btn-start').textContent = translations[lang].START_CLASS;
document.getElementById('start-desc').innerHTML = (classroomStaticMode ? translations[lang].START_DESC_STATIC : translations[lang].START_DESC_DYNAMIC).replace(/\n/g, '<br>');

document.getElementById('rules-title').textContent = translations[lang].RULES_TITLE;
document.getElementById('rule-1').textContent = translations[lang].RULE_1;
document.getElementById('rule-2').textContent = translations[lang][classroomStaticMode ? 'RULE_2_STATIC' : 'RULE_2_DYNAMIC'];
document.getElementById('rule-3').textContent = translations[lang].RULE_3;
document.getElementById('btn-ready').textContent = translations[lang].BTN_READY;

const versionLabel = `v${CARTRIDGE_VERSION}`;
document.querySelectorAll('[data-cartridge-version]').forEach((el) => {
 el.textContent = versionLabel;
});

/** Desk index that maps to the human-controlled student sprite. */
const PLAYER_STUDENT_INDEX = 2;
/** Target rounds per class, scales with playlist, capped for a finishable session. */
const ROUNDS_PER_CLASS_MIN = 9;
const ROUNDS_PER_CLASS_MAX = 12;
const MAX_CLASSES_PER_SESSION = 3;
const MAX_CONCEPT_ATTEMPTS = 48;
const BOARD_TOPICS_PER_PAGE = 3;

class GameEngine {
 /* Async state machine: DIALOGUE/INPUT_* states gate which overlay receives keyboard and tap input. */
 constructor(canvas) {
 this.canvas = canvas;
 this.ctx = canvas.getContext('2d');
 this.width = 800;
 this.height = 600;
 this.canvas.width = this.width;
 this.canvas.height = this.height;

 this.lang = lang;
 this.state = 'INIT';
 this.frame = 0;

 this.assets = {
 prof: SpriteGen.generateProfessor(),
 bg: SpriteGen.generateBackground(this.width, this.height),
 desk: SpriteGen.generateDesk(),
 studentLola: SpriteGen.generateStudent({
 shirt: Colors.lola, shirtShade: Colors.lolaShade,
 hair: '#7f1d1d', hairShade: '#450a0a',
 hairStyle: 'pigtails', mouth: 'smile', happy: false, freckles: true
 }),
 studentTimmy: SpriteGen.generateStudent({
 shirt: Colors.timmy, shirtShade: Colors.timmyShade,
 hair: '#facc15', hairShade: '#ca8a04',
 hairStyle: 'short', mouth: 'smile', happy: false, glasses: true
 }),
 studentPlayer: SpriteGen.generateStudent({
 shirt: Colors.player, shirtShade: Colors.playerShade,
 hair: '#a16207', hairShade: '#713f12',
 hairStyle: 'sprout', mouth: 'smile', happy: true
 })
 };

 this.students = [
 { id: 'lola', name: 'Lola', color: Colors.lola, score: 0, x: 200, y: 380, sprite: this.assets.studentLola },
 { id: 'timmy', name: 'Timmy', color: Colors.timmy, score: 0, x: 400, y: 380, sprite: this.assets.studentTimmy },
 {
 id: 'you',
 name: this.resolvePlayerDisplayName(),
 color: Colors.player,
 score: 0,
 x: 600,
 y: 380,
 sprite: this.assets.studentPlayer
 }
 ];

 if (window.arborito) {
 const savedScore = window.arborito.load('career_score');
 if (savedScore) {
 this.students[2].score = savedScore;
 }
 }

 this.professor = { x: 700, y: 350, sprite: this.assets.prof };
 this.particles = [];

 this.lessonData = { text: "Loading...", concepts: [] };
 this.currentRound = 0;
 this.currentQ = null;
 this.answeringStudentIndex = 0;
 this.lastJudgmentCorrect = null;
 this.classNumber = 1;
 this.sessionClassIndex = 1;
 this.sessionClassCap = MAX_CLASSES_PER_SESSION;
 this.streak = 0;
 this.bestStreak = 0;
 this.sessionCorrect = 0;
 this.sessionWrong = 0;
 this.judgeCorrect = 0;
 this.boardWipe = null;
 /** First concept index shown on the board (changes only after a wipe). */
 this.boardDisplayStart = 0;

 this.ui = {
 gameUi: document.getElementById('game-ui'),
 dialogueStack: document.getElementById('dialogue-stack'),
 dialogueBox: document.getElementById('dialogue-box'),
 speakerName: document.getElementById('speaker-name'),
 dialogueText: document.getElementById('dialogue-text'),
 btnNext: document.getElementById('btn-next'),
 shoutBubble: document.getElementById('shout-bubble'),
 overlay: document.getElementById('input-overlay'),
 btnTrue: document.getElementById('btn-judge-true'),
 btnFalse: document.getElementById('btn-judge-false'),
 textOverlay: document.getElementById('text-overlay'),
 inputField: document.getElementById('player-input'),
 btnSubmit: document.getElementById('btn-submit'),
 choiceOverlay: document.getElementById('choice-overlay'),
 choiceOptions: document.getElementById('choice-options'),
 choicePrompt: document.getElementById('choice-prompt'),
 victoryOverlay: document.getElementById('victory-overlay'),
 victoryTitle: document.getElementById('victory-title'),
 victoryStats: document.getElementById('victory-stats'),
 victoryRank: document.getElementById('victory-rank'),
 btnVictoryContinue: document.getElementById('btn-victory-continue')
 };

 this.ui.inputField.placeholder = this.getLine('TYPE_ANSWER');
 this.ui.btnSubmit.textContent = this.getLine('SUBMIT');
 this.ui.btnTrue.textContent = this.getLine('JUDGE_CORRECT');
 this.ui.btnFalse.textContent = this.getLine('JUDGE_WRONG');
 this.ui.btnNext.textContent = this.getLine('NEXT_BTN');
 this.ui.speakerName.textContent = this.getLine('UNKNOWN_SPEAKER');
 if (this.ui.choicePrompt) this.ui.choicePrompt.textContent = this.getLine('CHOOSE_OPTION');

 this.inputResolver = null;
 this.textResolver = null;
 this.choiceResolver = null;
 this.setupInput();
 }

 getLine(key, replacements = {}) {
 let line = translations[this.lang][key] || translations['EN'][key] || `[${key}]`;
 for(const [k, v] of Object.entries(replacements)) {
 line = line.replace(`{${k}}`, v);
 }
 return line;
 }

 resolvePlayerDisplayName() {
 const raw = window.arborito && window.arborito.user ? String(window.arborito.user.username || '').trim() : '';
 const generic = new Set(['', 'Student', 'Estudiante']);
 if (raw && !generic.has(raw)) return raw;
 return this.lang === 'ES' ? 'Tú' : 'You';
 }

 syncPlayerDisplayName() {
 const you = this.students && this.students[2];
 if (you) you.name = this.resolvePlayerDisplayName();
 }

 clipCanvasText(ctx, text, maxWidth) {
 let s = String(text || '');
 if (!s) return '';
 if (ctx.measureText(s).width <= maxWidth) return s;
 while (s.length > 1 && ctx.measureText(`${s}…`).width > maxWidth) {
 s = s.slice(0, -1);
 }
 return `${s}…`;
 }

 /** Static mode: Quiz V2 from the lesson only (no on-device AI). */
 isStaticMode() {
 return !!(window.arborito && typeof window.arborito.getAIMode === 'function' && window.arborito.getAIMode() === 'static');
 }

 pickStudentAnswer(concept, isRight) {
 const correct = String(concept.correct || '').trim();
 const junk = (v) => {
 const t = String(v || '').trim();
 return !t || t === ':' || t === ': ' || t === '\u2014' || t === '-' || t === '–' || t === '…' || t === '...' || t === 'N/A' || t === 'Unknown';
 };
 const wrongPool = (Array.isArray(concept.options) ? concept.options : [])
 .map((v) => String(v || '').trim())
 .filter((v) => !junk(v))
 .filter((v) => v.toLowerCase() !== correct.toLowerCase());
 const wrongField = String(concept.wrong || '').trim();
 const fallbackWrong =
 (!junk(wrongField) && wrongField) ||
 wrongPool[0] ||
 (this.lang === 'EN' ? 'Wrong 1' : 'Incorrecto 1');
 if (isRight) return correct || fallbackWrong;
 if (wrongPool.length > 1) {
 return wrongPool[Math.floor(Math.random() * wrongPool.length)];
 }
 return fallbackWrong;
 }

 buildPlayerOptions(concept) {
 const api = window.arborito && window.arborito.quiz;
 if (api && typeof api.buildOptions === 'function') {
 const pool = (this.lessonData?.concepts || [])
 .map((c) => String(c.correct || '').trim())
 .filter(Boolean);
 return api.buildOptions(concept, { count: 4, distractorPool: pool, lang: this.lang });
 }
 const correct = String(concept.correct || '').trim();
 const wrong = String(concept.wrong || '').trim();
 const junk = (v) => {
 const t = String(v || '').trim();
 return !t || t === ':' || t === ': ' || t === '\u2014' || t === '-' || t === '–' || t === '…' || t === '...' || t === 'N/A' || t === 'Unknown';
 };
 const out = [];
 if (correct) out.push(correct);
 if (!junk(wrong) && wrong.toLowerCase() !== correct.toLowerCase()) out.push(wrong);
 while (out.length < 2 && correct) {
 out.push(this.lang === 'EN' ? `Wrong ${out.length}` : `Incorrecto ${out.length}`);
 }
 return out;
 }

 answersMatch(playerAnswer, expected) {
 const api = window.arborito && window.arborito.quiz;
 if (api && typeof api.answersMatch === 'function') {
 return api.answersMatch(playerAnswer, expected);
 }
 const cleanPlayer = String(playerAnswer || '').trim().toLowerCase();
 const cleanCorrect = String(expected || '').trim().toLowerCase();
 if (!cleanPlayer || !cleanCorrect) return false;
 return cleanPlayer === cleanCorrect;
 }

 async resolveLessonForItem(item) {
 const arb = window.arborito;
 if (!arb?.lesson || !item?.lessonId) return null;
 try {
 if (typeof arb.lesson.byId === 'function') return await arb.lesson.byId(item.lessonId);
 } catch (_) {}
 return null;
 }

 setTextInputBusy(busy) {
 if (!this.ui.inputField || !this.ui.btnSubmit) return;
 this.ui.inputField.disabled = !!busy;
 this.ui.btnSubmit.disabled = !!busy;
 if (busy) {
 this.ui.inputField.placeholder = this.getLine('EVALUATING');
 } else {
 this.ui.inputField.placeholder = this.getLine('TYPE_ANSWER');
 }
 }

 async evaluatePlayerAnswer(concept, playerText) {
 const text = String(playerText || '').trim();
 if (!text) return false;

 const arb = window.arborito;
 const quiz = arb && arb.quiz;
 if (!quiz) return false;

 if (this.isStaticMode()) {
 return this.answersMatch(text, concept.correct);
 }

 if (typeof quiz.gradeAnswer !== 'function') {
 return this.answersMatch(text, concept.correct);
 }

 try {
 this.setTextInputBusy(true);
 const lesson = await this.resolveLessonForItem(concept);
 if (!lesson) return this.answersMatch(text, concept.correct);
 return await quiz.gradeAnswer(lesson, concept, text);
 } catch {
 return this.answersMatch(text, concept.correct);
 } finally {
 this.setTextInputBusy(false);
 }
 }

 contentFailureMessage(err) {
 const msg = (err && err.message) ? String(err.message) : '';
 const code = err && err.code ? String(err.code) : '';
 if (this.isStaticMode() || /STATIC_QUIZ|questionnaire|Quiz V2/i.test(msg)) {
 return this.getLine('SYSTEM_FAILURE_STATIC');
 }
 if (/AI_|not available in static|ask\.json/i.test(code + msg)) {
 return this.getLine('SYSTEM_FAILURE_AI');
 }
 return this.getLine('SYSTEM_FAILURE');
 }

 setupInput() {
 const tryAdvance = () => {
 // Trust the dialogue queue itself: if there is something to advance/skip, do it.
 if (this.skipTypingCallback || this.advanceCallback) {
 this.advanceDialogue();
 }
 };

 document.addEventListener('keydown', (e) => {
 if (this.state === 'INPUT_TEXT') {
 if (e.key === 'Enter') {
 e.preventDefault();
 this.submitText();
 }
 return;
 }
 if (e.key === ' ' || e.key === 'Enter') {
 if (this.skipTypingCallback || this.advanceCallback) {
 e.preventDefault();
 this.advanceDialogue();
 }
 }
 });

 // Plain click handler : works on mobile + desktop, no preventDefault tricks.
 this.ui.btnNext.addEventListener('click', (e) => {
 e.stopPropagation();
 tryAdvance();
 });
 this.ui.dialogueBox.addEventListener('click', (e) => {
 if (e.target.closest('#btn-next')) return;
 tryAdvance();
 });

 this.ui.btnTrue.addEventListener('click', () => this.resolveInput(true));
 this.ui.btnFalse.addEventListener('click', () => this.resolveInput(false));
 this.ui.btnSubmit.addEventListener('click', () => this.submitText());
 if (this.ui.btnVictoryContinue) {
 this.ui.btnVictoryContinue.addEventListener('click', () => this.startNewClass());
 }
 }

 resolveInput(val) {
 if (this.state === 'INPUT' && this.inputResolver) {
 this.inputResolver(val);
 this.ui.overlay.style.display = 'none';
 }
 }

 submitText() {
 if (this.state === 'INPUT_TEXT' && this.textResolver) {
 if (this.ui.inputField?.disabled) return;
 const val = this.ui.inputField.value.trim();
 if (val.length === 0) return;
 const resolver = this.textResolver;
 this.textResolver = null;
 this.state = 'EVALUATING';
 resolver(val);
 }
 }

 start() {
 this.loop();
 this.loadContent();
 }

 loop() {
 this.update();
 this.draw();
 this.frame++;
 requestAnimationFrame(() => this.loop());
 }

 update() {
 const bob = Math.sin(this.frame / 15) * 2;
 this.professor.yDraw = this.professor.y + bob;

 this.students.forEach((s, i) => {
 if ((this.state === 'DIALOGUE_STUDENT' && this.answeringStudentIndex === i) || (this.state === 'PLAYER_TURN' && i === 2)) {
 s.yDraw = s.y + Math.sin(this.frame / 5) * 5;
 } else {
 s.yDraw = s.y + Math.sin((this.frame + i*100) / 30);
 }
 });

 for (let i = this.particles.length - 1; i >= 0; i--) {
 const p = this.particles[i];
 p.life--;
 p.x += p.vx;
 p.y += p.vy;
 if (p.life <= 0) this.particles.splice(i, 1);
 }
 }

 draw() {
 const ctx = this.ctx;
 ctx.clearRect(0, 0, this.width, this.height);
 ctx.drawImage(this.assets.bg, 0, 0);
 this.drawBoardContent(ctx);
 this.drawRank(ctx);
 this.drawSessionHud(ctx);

 ctx.save();
 ctx.translate(this.professor.x, this.professor.yDraw);

 if (this.state === 'GENERATING') {
 ctx.fillStyle = '#fff';
 ctx.strokeStyle = '#000';
 ctx.lineWidth = 4;

 const bubbleX = -60;
 const bubbleY = -170;

 ctx.beginPath();
 ctx.moveTo(bubbleX + 20, bubbleY + 40);
 ctx.quadraticCurveTo(bubbleX, bubbleY + 20, bubbleX + 20, bubbleY);
 ctx.quadraticCurveTo(bubbleX + 40, bubbleY - 20, bubbleX + 60, bubbleY);
 ctx.quadraticCurveTo(bubbleX + 80, bubbleY + 20, bubbleX + 60, bubbleY + 40);
 ctx.quadraticCurveTo(bubbleX + 40, bubbleY + 60, bubbleX + 20, bubbleY + 40);
 ctx.stroke();
 ctx.fill();

 ctx.beginPath(); ctx.arc(bubbleX + 30, bubbleY + 55, 6, 0, Math.PI*2); ctx.stroke(); ctx.fill();
 ctx.beginPath(); ctx.arc(bubbleX + 25, bubbleY + 70, 4, 0, Math.PI*2); ctx.stroke(); ctx.fill();

 ctx.fillStyle = '#000';
 ctx.font = '30px monospace';
 const dots = '.'.repeat((Math.floor(this.frame / 20) % 3) + 1);
 ctx.fillText(dots, bubbleX + 25, bubbleY + 30);
 }

 ctx.scale(2.4, 2.4);
 ctx.drawImage(this.assets.prof, -20, -48);
 ctx.restore();

 this.students.forEach(s => {
 ctx.save();
 ctx.translate(s.x, s.yDraw);
 const isActing = (this.state === 'DIALOGUE_STUDENT' && this.students.indexOf(s) === this.answeringStudentIndex) ||
 (this.state === 'PLAYER_TURN' && s.id === 'you');
 if (isActing) {
 ctx.filter = "brightness(1.25) saturate(1.1)";
 this.drawArrow(ctx, 0, -86);
 }
 ctx.scale(2.2, 2.2);
 ctx.drawImage(s.sprite, -20, -42);
 ctx.restore();
 ctx.drawImage(this.assets.desk, s.x - 60, s.y - 6, 120, 90);
 });

 this.particles.forEach(p => {
 ctx.fillStyle = p.color || '#fff';
 ctx.fillRect(p.x, p.y, p.size, p.size);
 });
 }

 fillBoardWritingArea(ctx) {
 const rect = this.getBoardRect();
 ctx.save();
 ctx.fillStyle = Colors.board;
 ctx.fillRect(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16);
 ctx.restore();
 }

 getBoardRect() {
 const w = this.width;
 const h = this.height;
 return {
 x: w * 0.18,
 y: h * 0.08,
 w: w * 0.64,
 h: h * 0.36,
 };
 }

 /** Full-board chalk wipe (~900ms sweep + brief hold), no dialogue. */
 quickEraseBoard(nextStart = null) {
 if (this.boardWipe) return Promise.resolve();
 const sweepMs = 900;
 const holdMs = 280;
 return new Promise((resolve) => {
 const started = performance.now();
 const tick = (now) => {
 const elapsed = now - started;
 const progress = Math.min(1, elapsed / sweepMs);
 this.boardWipe = { progress, phase: progress < 1 ? 'sweep' : 'hold', holdStarted: started + sweepMs };

 if (progress < 1) {
 const rect = this.getBoardRect();
 for (let n = 0; n < 3; n++) {
 this.particles.push({
 x: rect.x + 8 + (rect.w - 16) * progress + (Math.random() - 0.5) * 18,
 y: rect.y + 12 + Math.random() * (rect.h - 24),
 vx: (Math.random() - 0.5) * 2.2,
 vy: -Math.random() * 2.4,
 life: 14 + Math.floor(Math.random() * 10),
 size: 2 + Math.floor(Math.random() * 2),
 color: Math.random() > 0.35 ? '#fef9e7' : '#e8f5ee',
 });
 }
 requestAnimationFrame(tick);
 return;
 }

 if (elapsed < sweepMs + holdMs) {
 requestAnimationFrame(tick);
 return;
 }

 this.boardWipe = null;
 if (nextStart != null) this.boardDisplayStart = nextStart;
 resolve();
 };
 requestAnimationFrame(tick);
 });
 }

 async eraseBoardIfPageDone(nextRound) {
 if (nextRound <= 0 || nextRound % BOARD_TOPICS_PER_PAGE !== 0) return;
 const total = this.lessonData.concepts?.length || 0;
 const nextStart = nextRound;
 if (nextStart < total) {
 await this.quickEraseBoard(nextStart);
 } else {
 await this.quickEraseBoard(null);
 }
 }

 drawBoardEraseSweep(ctx, progress) {
 const rect = this.getBoardRect();
 const x = rect.x + 8;
 const y = rect.y + 8;
 const w = rect.w - 16;
 const h = rect.h - 16;
 const sweep = x + w * Math.min(1, progress);
 ctx.save();
 ctx.fillStyle = Colors.board;
 ctx.fillRect(x, y, w, h);
 if (progress < 1) {
 ctx.fillStyle = 'rgba(232, 245, 238, 0.72)';
 ctx.fillRect(x, y, Math.max(0, sweep - x), h);
 ctx.fillStyle = '#fef9e7';
 ctx.fillRect(Math.max(x, sweep - 36), y + h * 0.22, 34, 14);
 ctx.fillRect(Math.max(x, sweep - 28), y + h * 0.52, 28, 12);
 ctx.fillStyle = 'rgba(255,255,255,0.35)';
 ctx.fillRect(Math.max(x, sweep - 8), y, 6, h);
 }
 ctx.restore();
 }

 drawBoardContent(ctx) {
 const topicX = 180;
 const statusX = 500;
 const maxTopicW = statusX - topicX - 28;
 const slotYs = [120, 155, 190];
 const concepts = this.lessonData.concepts;
 if (!concepts) return;

 this.fillBoardWritingArea(ctx);

 ctx.font = '20px monospace';
 ctx.textAlign = 'left';
 ctx.fillStyle = Colors.term_green;
 ctx.fillText(this.getLine('TOPICS'), topicX, 85);

 if (this.boardWipe) {
 this.drawBoardEraseSweep(ctx, this.boardWipe.progress);
 return;
 }

 const start = this.boardDisplayStart;
 const activeSlot =
 this.currentRound >= start && this.currentRound < start + BOARD_TOPICS_PER_PAGE
 ? this.currentRound - start
 : -1;
 for (let slot = 0; slot < BOARD_TOPICS_PER_PAGE; slot++) {
 const i = start + slot;
 const c = concepts[i];
 const y = slotYs[slot];
 const label = c ? `- ${c.topic || '?'}` : '- …';
 ctx.fillStyle = slot === activeSlot ? '#fbbf24' : '#fff';
 let drawLabel = label;
 while (ctx.measureText(drawLabel).width > maxTopicW && drawLabel.length > 4) {
 drawLabel = drawLabel.slice(0, -2);
 }
 if (drawLabel !== label) drawLabel = `${drawLabel.slice(0, -1)}…`;
 ctx.fillText(drawLabel, topicX, y);
 ctx.textAlign = 'center';
 if (c?.status === 'correct') {
 ctx.fillStyle = '#4ade80';
 ctx.fillText('✔', statusX, y);
 } else if (c?.status === 'wrong') {
 ctx.fillStyle = '#ef4444';
 ctx.fillText('✘', statusX, y);
 } else {
 ctx.fillStyle = '#64748b';
 ctx.fillText('·', statusX, y);
 }
 ctx.textAlign = 'left';
 }
 }

 drawSessionHud(ctx) {
 const total = this.lessonData.concepts?.length || 0;
 if (!total) return;
 const current = Math.min(this.currentRound + 1, total);
 const x = this.width - 168;
 const y = 18;
 const w = 150;
 const h = 54;
 ctx.save();
 ctx.fillStyle = 'rgba(0,0,0,0.72)';
 ctx.fillRect(x, y, w, h);
 ctx.strokeStyle = '#fbbf24';
 ctx.lineWidth = 2;
 ctx.strokeRect(x, y, w, h);
 ctx.fillStyle = '#fbbf24';
 ctx.font = '13px monospace';
 ctx.textAlign = 'left';
 ctx.fillText(this.getLine('ROUND_LABEL', { current, total }), x + 8, y + 18);
 ctx.fillStyle = '#fff';
 ctx.fillText(`${this.getLine('CLASS_NUMBER', { n: this.classNumber })}`, x + 8, y + 34);
 if (this.streak >= 2) {
 ctx.fillStyle = '#4ade80';
 ctx.fillText(`🔥 x${this.streak}`, x + 8, y + 50);
 }
 ctx.restore();
 }

 roundsForSession() {
 const list = window.arborito?.lesson?.list?.() || [];
 const n = Array.isArray(list) ? list.length : 0;
 // Several questions even with few lessons (reuse allowed); cap for a clear end.
 const target = Math.max(ROUNDS_PER_CLASS_MIN, Math.min(ROUNDS_PER_CLASS_MAX, (n || 3) * 3));
 return target;
 }

 async loadClassConcepts(roundCount = ROUNDS_PER_CLASS_MIN) {
 const api = window.arborito && window.arborito.quiz;
 if (!api || typeof api.pool !== 'function') return [];
 // uniqueLessons:false, with 2–3 selected lessons we still fill a full class.
 const pool = await api.pool({
 count: roundCount,
 maxAttempts: MAX_CONCEPT_ATTEMPTS,
 uniqueLessons: false,
 uniqueQuestions: true,
 });
 return pool.slice(0, roundCount).map((item) => ({
 ...item,
 status: 'pending',
 }));
 }

 drawRank(ctx) {
 this.syncPlayerDisplayName();
 const x = 20;
 const y = 20;
 const w = 140;
 const h = 120;
 const pad = 8;
 ctx.save();
 ctx.beginPath();
 ctx.rect(x, y, w, h);
 ctx.clip();
 ctx.fillStyle = '#111';
 ctx.fillRect(x, y, w, h);
 ctx.strokeStyle = '#fff';
 ctx.lineWidth = 3;
 ctx.strokeRect(x, y, w, h);
 ctx.fillStyle = '#fbbf24';
 ctx.font = '16px monospace';
 ctx.textAlign = 'left';
 ctx.fillText(this.clipCanvasText(ctx, this.getLine('RANK'), w - pad * 2), x + pad, y + 25);
 ctx.strokeStyle = '#fff';
 ctx.beginPath();
 ctx.moveTo(x, y + 35);
 ctx.lineTo(x + w, y + 35);
 ctx.stroke();
 let rowY = y + 55;
 ctx.font = '14px monospace';
 [...this.students].sort((a, b) => b.score - a.score).forEach((s) => {
 ctx.fillStyle = s.color;
 ctx.fillText(this.clipCanvasText(ctx, s.name, 72), x + pad, rowY);
 ctx.fillStyle = '#fff';
 ctx.textAlign = 'right';
 ctx.fillText(this.clipCanvasText(ctx, `${s.score} ★`, 44), x + w - pad, rowY);
 ctx.textAlign = 'left';
 rowY += 22;
 });
 ctx.restore();
 }

 drawArrow(ctx, x, y) {
 ctx.fillStyle = '#fbbf24';
 ctx.beginPath();
 ctx.moveTo(x - 10, y);
 ctx.lineTo(x + 10, y);
 ctx.lineTo(x, y + 10);
 ctx.fill();
 }

 clearBoard() {
 this.lessonData = { text: "...", concepts: [] };
 this.currentRound = 0;
 this.boardDisplayStart = 0;
 this.boardWipe = null;
 this.ui.dialogueStack.style.display = 'none';
 this.ui.dialogueBox.style.display = 'none';
 this.ui.btnNext.style.display = 'none';
 this.ui.overlay.style.display = 'none';
 this.ui.textOverlay.style.display = 'none';
 this.ui.choiceOverlay.style.display = 'none';
 this.ui.choiceOptions.innerHTML = '';
 if (this.ui.gameUi) this.ui.gameUi.classList.remove('has-choices');
 }

 addPlayerScore(amount, { countsAsCorrect = null } = {}) {
 const player = this.students[2];
 const bonus = Math.max(0, Math.floor(Number(amount) || 0));
 if (bonus <= 0) return;
 player.score += bonus;

 if (countsAsCorrect === true) {
 this.sessionCorrect++;
 this.streak++;
 this.bestStreak = Math.max(this.bestStreak, this.streak);
 if (this.streak >= 2) {
 const streakBonus = Math.min(15, this.streak * 3);
 player.score += streakBonus;
 this.shout(this.getLine('STREAK_BONUS', { streak: this.streak, bonus: streakBonus }), true);
 }
 } else if (countsAsCorrect === false) {
 this.sessionWrong++;
 this.streak = 0;
 }

 if (window.arborito) {
 window.arborito.xp(bonus);
 }
 if (window.arborito) {
 window.arborito.save('career_score', player.score);
 }
 }

 async loadContent() {
 this.clearBoard();
 this.state = 'DIALOGUE';
 const loadingLine = this.isStaticMode() ? this.getLine('LOADING_STATIC') : this.getLine('LOADING');
 await this.showDialogue("SYSTEM", loadingLine, true);
 this.state = 'GENERATING';

 try {
 if (!window.arborito || typeof window.arborito.lesson?.next !== 'function' || typeof window.arborito.quiz !== 'function') {
 throw new Error("Arborito bridge is incomplete (lesson/quiz).");
 }

 const list = window.arborito?.lesson?.list?.() || [];
 const playlistLen = Array.isArray(list) ? Math.max(1, list.length) : 1;
 this.sessionClassCap = Math.max(1, Math.min(MAX_CLASSES_PER_SESSION, playlistLen));
 this.sessionClassIndex = 1;

 const concepts = await this.loadClassConcepts(this.roundsForSession());
 if (concepts.length > 0) {
 this.lessonData.concepts = concepts;
 this.boardDisplayStart = 0;
 const introTopic = concepts
 .slice(0, BOARD_TOPICS_PER_PAGE)
 .map((c) => c.topic)
 .filter(Boolean)
 .join(', ');
 await this.showDialogue(
 'PROFESSOR',
 `${this.getLine('NEW_TOPIC')}${introTopic || '…'}`
);
 await this.runRound();
 } else {
 /* Whole playlist had no playable Quiz V2 questionnaires. Don't ask
 the student to write content : show a short neutral line and
 bow out so they can pick a different module. */
 await this.showDialogue("SYSTEM", this.getLine('SYSTEM_FAILURE_STATIC'));
 }

 } catch(e) {
 console.error("Classroom content error:", e);
 await this.showDialogue("SYSTEM", this.contentFailureMessage(e));
 }
 }

 async runRound() {
 if (this.currentRound >= this.lessonData.concepts.length) {
 await this.victory();
 return;
 }

 const concept = this.lessonData.concepts[this.currentRound];
 this.currentQ = concept;

 this.answeringStudentIndex = this.currentRound % 3;
 const student = this.students[this.answeringStudentIndex];

 if (this.answeringStudentIndex === PLAYER_STUDENT_INDEX) {
 this.state = 'PLAYER_TURN';
 await this.showDialogue("PROFESSOR", this.getLine('ASK_PLAYER', {question: concept.q}));
 let isCorrect;
 if (this.isStaticMode()) {
 this.state = 'INPUT_CHOICE';
 const options = this.buildPlayerOptions(concept);
 const picked = await this.waitForChoice(options.length >= 2 ? options : [concept.correct, concept.wrong].filter(Boolean));
 isCorrect = this.answersMatch(picked, concept.correct);
 } else {
 this.state = 'INPUT_TEXT';
 const playerText = await this.waitForText();
 isCorrect = await this.evaluatePlayerAnswer(concept, playerText);
 this.ui.textOverlay.style.display = 'none';
 this.ui.inputField.value = '';
 this.ui.inputField.blur();
 this.setTextInputBusy(false);
 }

 if (isCorrect) {
 this.shout(this.getLine('CORRECT'), true);
 this.spawnParticles(student.x, student.y, '#4ade80');
 this.addPlayerScore(20, { countsAsCorrect: true });
 concept.status = 'correct';
 await this.showDialogue("PROFESSOR", this.getLine('GOOD_JOB', { answer: concept.correct }));
 } else {
 this.shout(this.getLine('WRONG'), false);
 this.shakeScreen();
 this.spawnParticles(student.x, student.y, '#ef4444');
 this.addPlayerScore(0, { countsAsCorrect: false });
 concept.status = 'wrong';
 await this.showDialogue("PROFESSOR", this.getLine('INCORRECT', { answer: concept.correct }));
 }
 } else {
 this.state = 'DIALOGUE';
 await this.showDialogue("PROFESSOR", `${concept.topic}: ${concept.q}`);
 const isRight = Math.random() > 0.4;
 const answerText = this.pickStudentAnswer(concept, isRight);

 if (isRight) student.score += 10;

 this.state = 'DIALOGUE_STUDENT';
 await this.showDialogue(student.name.toUpperCase(), answerText);
 this.state = 'INPUT';
 const playerJudge = await this.waitForInput();
 const judgmentCorrect = (isRight && playerJudge) || (!isRight && !playerJudge);

 if (judgmentCorrect) {
 this.shout(this.getLine('ACCEPTED'), true);
 this.spawnParticles(this.students[2].x, this.students[2].y, '#4ade80');
 this.addPlayerScore(10, { countsAsCorrect: true });
 this.judgeCorrect++;
 concept.status = 'correct';
 await this.showDialogue("PROFESSOR", this.getLine('WELL_SPOTTED'));
 } else {
 this.shout(this.getLine('OBJECTION'), false);
 this.shakeScreen();
 this.spawnParticles(this.students[2].x, this.students[2].y, '#ef4444');
 this.addPlayerScore(0, { countsAsCorrect: false });
 if (isRight) {
 await this.showDialogue("PROFESSOR", this.getLine('STUDENT_WAS_CORRECT', { name: student.name }));
 } else {
 await this.showDialogue("PROFESSOR", this.getLine('PAY_ATTENTION'));
 }
 concept.status = 'wrong';
 }
 }
 const nextRound = this.currentRound + 1;
 await this.eraseBoardIfPageDone(nextRound);
 this.currentRound = nextRound;
 await this.runRound();
 }

 gradeForSession(correct, total) {
 const rate = total > 0 ? correct / total : 0;
 if (rate >= 0.85) return this.getLine('GRADE_A');
 if (rate >= 0.65) return this.getLine('GRADE_B');
 if (rate >= 0.45) return this.getLine('GRADE_C');
 return this.getLine('GRADE_D');
 }

 async victory() {
 this.state = 'VICTORY';
 const pScore = this.students[2].score;
 const total = this.lessonData.concepts.length;
 const correct = this.lessonData.concepts.filter((c) => c.status === 'correct').length;
 const rank = [...this.students].sort((a, b) => b.score - a.score).findIndex((s) => s.id === 'you') + 1;
 const grade = this.gradeForSession(correct, total);

 this.shout(this.getLine('DISMISSED'));
 await this.showDialogue(
 'PROFESSOR',
 this.getLine('FINAL_TALLY', { score: pScore })
);

 if (this.ui.victoryOverlay) {
 if (this.ui.victoryTitle) {
 this.ui.victoryTitle.textContent = this.getLine('VICTORY_TITLE');
 }
 if (this.ui.victoryStats) {
 this.ui.victoryStats.textContent = this.getLine('VICTORY_STATS', {
 score: pScore,
 correct,
 total,
 bestStreak: this.bestStreak
 });
 }
 if (this.ui.victoryRank) {
 this.ui.victoryRank.textContent = this.getLine('VICTORY_RANK', { rank, grade });
 }
 if (this.ui.btnVictoryContinue) {
 const more = this.sessionClassIndex < this.sessionClassCap;
 this.ui.btnVictoryContinue.textContent = more
 ? this.getLine('BTN_NEW_CLASS')
 : this.getLine('BTN_SESSION_DONE');
 this.ui.btnVictoryContinue.dataset.sessionDone = more ? '0' : '1';
 }
 this.ui.victoryOverlay.style.display = 'flex';
 }
 }

 async startNewClass() {
 if (this.ui.victoryOverlay) this.ui.victoryOverlay.style.display = 'none';
 if (this.sessionClassIndex >= this.sessionClassCap) {
 // Soft finish: restart a new session from the playlist without closing the game.
 this.sessionClassIndex = 0;
 this.classNumber = 1;
 } else {
 this.classNumber++;
 }
 this.sessionClassIndex++;
 this.streak = 0;
 this.bestStreak = 0;
 this.sessionCorrect = 0;
 this.sessionWrong = 0;
 this.judgeCorrect = 0;
 this.currentRound = 0;
 await this.loadContentForNextClass();
 }

 /** Continue the open session, do not reset sessionClassCap. */
 async loadContentForNextClass() {
 this.clearBoard();
 this.state = 'DIALOGUE';
 const loadingLine = this.isStaticMode() ? this.getLine('LOADING_STATIC') : this.getLine('LOADING');
 await this.showDialogue("SYSTEM", loadingLine, true);
 this.state = 'GENERATING';
 try {
 if (!window.arborito || typeof window.arborito.lesson?.next !== 'function' || typeof window.arborito.quiz !== 'function') {
 throw new Error("Arborito bridge is incomplete (lesson/quiz).");
 }
 const concepts = await this.loadClassConcepts(this.roundsForSession());
 if (concepts.length > 0) {
 this.lessonData.concepts = concepts;
 this.boardDisplayStart = 0;
 const introTopic = concepts
 .slice(0, BOARD_TOPICS_PER_PAGE)
 .map((c) => c.topic)
 .filter(Boolean)
 .join(', ');
 await this.showDialogue(
 'PROFESSOR',
 `${this.getLine('NEW_TOPIC')}${introTopic || '…'}`
);
 await this.runRound();
 } else {
 await this.showDialogue("SYSTEM", this.getLine('SYSTEM_FAILURE_STATIC'));
 }
 } catch (e) {
 console.error("Classroom content error:", e);
 await this.showDialogue("SYSTEM", this.contentFailureMessage(e));
 }
 }

 waitForInput() {
 this.ui.overlay.style.display = 'flex';
 return new Promise(resolve => this.inputResolver = resolve);
 }

 waitForText() {
 this.ui.textOverlay.style.display = 'flex';
 this.setTextInputBusy(false);
 this.ui.inputField.value = '';
 this.ui.inputField.focus();
 return new Promise(resolve => this.textResolver = resolve);
 }

 waitForChoice(options) {
 this.ui.choiceOptions.innerHTML = '';
 this.ui.btnNext.style.display = 'none';
 this.ui.btnNext.classList.remove('is-waiting');
 this.ui.choiceOverlay.style.display = 'flex';
 if (this.ui.choicePrompt) this.ui.choicePrompt.textContent = this.getLine('CHOOSE_OPTION');
 if (this.ui.gameUi) this.ui.gameUi.classList.add('has-choices');
 return new Promise((resolve) => {
 this.choiceResolver = resolve;
 options.forEach((opt) => {
 const btn = document.createElement('button');
 btn.type = 'button';
 btn.className = 'choice-opt-btn';
 btn.textContent = opt;
 bindMobileTap(btn, () => {
 if (!this.choiceResolver) return;
 const pick = opt;
 this.choiceResolver = null;
 this.ui.choiceOverlay.style.display = 'none';
 this.ui.choiceOptions.innerHTML = '';
 if (this.ui.gameUi) this.ui.gameUi.classList.remove('has-choices');
 resolve(pick);
 });
 this.ui.choiceOptions.appendChild(btn);
 });
 });
 }

 showDialogue(speaker, text, auto = false) {
 return new Promise(resolve => {
 this.advanceCallback = null;
 this.skipTypingCallback = null;
 const line = String(text ?? '').trim() || '…';
 this.ui.dialogueStack.style.display = 'flex';
 this.ui.dialogueBox.style.display = 'flex';
 this.ui.speakerName.innerText = speaker;
 this.ui.dialogueText.style.color = (speaker === 'PROFESSOR') ? '#000' : '#444';
 if (speaker === 'SYSTEM') this.ui.dialogueText.style.color = '#666';

 this.ui.btnNext.style.display = 'inline-flex';

 if (auto) {
 this.ui.btnNext.style.display = 'none';
 this.ui.btnNext.classList.remove('is-waiting');
 } else {
 this.ui.btnNext.classList.add('is-waiting');
 }

 if (this.currentTyping) clearInterval(this.currentTyping);
 this.currentTyping = null;

 let i = 0;
 let finished = false;
 const finish = () => {
 if (finished) return;
 finished = true;
 if (this.currentTyping) clearInterval(this.currentTyping);
 this.currentTyping = null;
 this.skipTypingCallback = null;
 this.ui.dialogueText.textContent = line;
 if (auto) {
 // Read time scales with text length: ~50ms per char, clamped 1.2s–4s.
 const readMs = Math.max(1200, Math.min(4000, line.length * 50));
 setTimeout(() => resolve(), readMs);
 } else {
 this.ui.btnNext.classList.remove('is-waiting');
 this.advanceCallback = () => {
 this.ui.btnNext.style.display = 'none';
 this.ui.btnNext.classList.remove('is-waiting');
 resolve();
 };
 }
 };

 this.ui.dialogueText.textContent = line.charAt(0) || '';
 i = 1;
 if (line.length <= 1) {
 finish();
 return;
 }

 this.skipTypingCallback = finish;
 this.currentTyping = setInterval(() => {
 this.ui.dialogueText.textContent += line.charAt(i);
 i++;
 if (i >= line.length) finish();
 }, 38);
 });
 }

 advanceDialogue() {
 if (this.skipTypingCallback) {
 const skip = this.skipTypingCallback;
 this.skipTypingCallback = null;
 skip();
 return;
 }
 if (this.advanceCallback) {
 const cb = this.advanceCallback;
 this.advanceCallback = null;
 cb();
 }
 }

 shout(text, isGood = false) {
 const el = this.ui.shoutBubble;
 el.innerText = text;

 if (isGood) {
 el.classList.add('is-success');
 } else {
 el.classList.remove('is-success');
 }

 el.style.display = 'block';
 el.classList.add('shake');
 setTimeout(() => {
 el.style.display = 'none';
 el.classList.remove('shake');
 }, 1500);
 }

 shakeScreen() {
 this.canvas.style.transform = `translate(${Math.random()*10-5}px, ${Math.random()*10-5}px)`;
 setTimeout(() => this.canvas.style.transform = 'none', 100);
 }

 spawnParticles(x, y, color) {
 for(let i=0; i<20; i++) {
 this.particles.push({
 x: x, y: y,
 vx: (Math.random() - 0.5) * 10,
 vy: (Math.random() - 0.5) * 10,
 life: 60,
 size: 4,
 color: color
 });
 }
 }
}

const canvas = document.getElementById('game-canvas');
const gameViewport = document.getElementById('game-viewport');

function resize() {
 const aspect = 4 / 3;
 const stage = document.getElementById('game-stage');
 if (!stage || !canvas || !gameViewport) return;
 const iw = stage.clientWidth;
 const ih = stage.clientHeight;
 if (iw < 2 || ih < 2) return;

 // Contain: keep full 4:3 scene visible. UI overlays the stage (not the viewport)
 // so on portrait phones the unused vertical space hosts the dialogue/buttons.
 let w;
 let h;
 if (iw / ih > aspect) {
 h = ih;
 w = Math.round(h * aspect);
 } else {
 w = iw;
 h = Math.round(w / aspect);
 }

 gameViewport.style.width = `${w}px`;
 gameViewport.style.height = `${h}px`;
 document.documentElement.style.setProperty('--classroom-vp-width', `${w}px`);
}

const stageEl = document.getElementById('game-stage');
initViewportListeners(resize, stageEl ? [stageEl, gameViewport] : null);
resize();

const startScreen = document.getElementById('start-screen');
const rulesOverlay = document.getElementById('rules-overlay');

document.getElementById('btn-start').addEventListener('click', () => {
 startScreen.style.display = 'none';
 rulesOverlay.style.display = 'flex';
});

document.getElementById('btn-ready').addEventListener('click', () => {
 rulesOverlay.style.display = 'none';
 document.body.classList.add('in-game');
 const engine = new GameEngine(canvas);
 engine.start();
});
