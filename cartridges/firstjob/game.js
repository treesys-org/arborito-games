import { CONFIG, Palette, AudioSynth, Input, SpriteGen, setTheme, ParticleSystem, TextManager } from './core.js';
import { Building } from './world.js';
import { GameLogic } from './logic.js';
import { GameUI } from './ui.js';
import { isStaticMode, loadQuizPool, buildOptions, pickRandom, pickUnusedFromPool } from './quiz-pool.js';

/** Offline/demo bridge when the cartridge runs outside an Arborito iframe. */
function ensureArboritoMock(lang) {
 if (window.arborito) return window.arborito;
 const es = lang === 'ES';
 const lessons = [
 {
 id: 'demo-1',
 title: es ? 'Protocolos de oficina' : 'Office protocols',
 text: es ? 'En una empresa moderna, la comunicación clara y el manejo del estrés son esenciales.' : 'In a modern company, clear communication and stress management are essential.',
 challenge: {
 main_question: es ? '¿Qué reduce el burnout?' : 'What reduces burnout?',
 correct_answer: es ? 'Pausas y límites saludables' : 'Breaks and healthy boundaries',
 core_concept: es ? 'Bienestar laboral' : 'Workplace wellness',
 traps: es ? ['Ignorar el estrés', 'Trabajar sin parar', 'Evitar al equipo'] : ['Ignoring stress', 'Working nonstop', 'Avoiding the team']
 }
 },
 {
 id: 'demo-2',
 title: es ? 'Atención al cliente' : 'Customer support',
 text: es ? 'Los tickets deben resolverse con empatía y conocimiento del producto.' : 'Tickets must be resolved with empathy and product knowledge.',
 challenge: {
 main_question: es ? '¿Primera regla del soporte?' : 'First rule of support?',
 correct_answer: es ? 'Escuchar al usuario' : 'Listen to the user',
 core_concept: es ? 'Soporte' : 'Support',
 traps: es ? ['Culpar al usuario', 'Cerrar sin leer', 'Ignorar el ticket'] : ['Blame the user', 'Close without reading', 'Ignore the ticket']
 }
 },
 {
 id: 'demo-3',
 title: es ? 'Seguridad IT' : 'IT security',
 text: es ? 'Las contraseñas débiles y los enlaces sospechosos son riesgos comunes.' : 'Weak passwords and suspicious links are common risks.',
 challenge: {
 main_question: es ? '¿Qué hacer con un enlace sospechoso?' : 'What to do with a suspicious link?',
 correct_answer: es ? 'Reportarlo a IT' : 'Report it to IT',
 core_concept: es ? 'Ciberseguridad' : 'Cybersecurity',
 traps: es ? ['Abrirlo para ver', 'Reenviarlo a todos', 'Ignorarlo'] : ['Open it to check', 'Forward to everyone', 'Ignore it']
 }
 }
 ];
 let lessonIdx = 0;
 window.arborito = {
 user: { lang: es ? 'es' : 'en' },
 getAIMode: () => 'static',
 async load() { return null; },
 save() {},
 xp() {},
 memory: { report() {} },
 lesson: {
 list: () => lessons,
 async next() { return lessons[lessonIdx++ % lessons.length]; },
 async at(i) { return lessons[i] || lessons[0]; }
 },
 async quiz(lesson) {
 const c = lesson.challenge || {};
 const traps = Array.isArray(c.traps) ? c.traps : [];
 return [{
 topic: lesson.title,
 q: c.main_question || lesson.title,
 correct: c.correct_answer || '',
 wrong: traps[0] || (es ? 'Respuesta incorrecta' : 'Wrong answer')
 }];
 },
 ask: { json: async () => ({}) }
 };
 return window.arborito;
}

const translations = {
 EN: {
 START_SHIFT: "START SHIFT",
 START_DESC: "ARBORITO ACADEMY · MENTOR SIM.<br>- Each <b>shift lasts ~3 min</b> (see clock ⏱).<br>- Stairs: <b>▲ UP top-left</b>, <b>▼ DOWN bottom-right</b>.<br>- Apprentices call you when they get stuck, find them and answer their question.<br>- Cafeteria de-stresses. Don't burn out.",
 START_DESC_STATIC: "ARBORITO ACADEMY · STATIC MODE<br>- Apprentices ask <b>multiple-choice</b> questions from your module.<br>- Use ↑↓ and [A] to pick the right answer.<br>- Each correct answer pays a fee.<br>- Mentor well. Don't burn out.",
 MOVE_DESC: "WASD / ARROWS<br>TO MOVE",
 ACTION_DESC: "Z / ENTER = A<br>X / ESC = B",
 BACK_LABEL: "BACK", ACT_LABEL: "ACT",
 WELCOME_MSG: "WELCOME TO {company}",
 BUSY_MSG: `Apprentice ({role}): "Studying. Thanks though!"`,
 FUNDS_MSG: "Insufficient funds.",
 CONSUMED_MSG: "{item} consumed!",
 INCOMING_CALL: "INCOMING CALL",
 PRESS_A: "PRESS [A]",
 FROM: "FROM: {caller}",
 OK: "OK", STRESS: "STRESS",
 SHOP_TITLE: "CAFETERIA - MENU",
 EFFECT: "EFFECT: {stress} Stress",
 SPEED_BONUS: " + SPEED",
 BUY: "BUY", EXIT: "EXIT",
 INTERVIEW: "INTERVIEW",
 RETRY: " (TRY #{num})",
 CALL_ENDED: "INTERVIEW DONE",
 APPROVED: "APPROVED ({score}/{total})\nWelcome to {company}.\n(+$200 Bonus)",
 REJECTED: "REJECTED ({score}/{total})\nNot ready to mentor yet.\nTry again?",
 CONTINUE: "CONTINUE",
 EVALUATING: "EVALUATING...",
 SUBMITTING: "SUBMITTING...",
 EXECUTE: "EXECUTE",
 TICKET: "QUESTION",
 ATTEMPTS: "TRIES: {num}",
 SOLUTION_PLACEHOLDER: "ANSWER...",
 TICKET_FAILED: `APPRENTICE LEFT CONFUSED. "{reply}"`,
 WRONG_ATTEMPTS: "WRONG! TRIES: {num}",
 GAME_OVER: "GAME OVER",
 BURNOUT: "BURNOUT - GAME OVER",
 SHIFT_COMPLETE: "SHIFT COMPLETE!",
 SHIFT_STATS: "Mentored: {tickets} · Earned: ${amount}",
 SHIFT_BREAK_TITLE: "SHIFT {num} DONE!",
 SHIFT_BREAK_BODY: "Great work. Take a breath.\nApprentices mentored: {tickets}\nEarned: ${amount}\nTotal saved: ${total}",
 NEXT_SHIFT: "START SHIFT {num}",
 NEXT_SHIFT_MSG: "SHIFT {num} STARTED, Good luck!",
 SHIFT_LABEL: "SHIFT",
 TIME_LABEL: "TIME",
 STAIR_UP_MSG: "▲ UP → {floor}",
 STAIR_DOWN_MSG: "▼ DOWN → {floor}",
 STAIR_HINT_UP: "▲ UP",
 STAIR_HINT_DOWN: "▼ DOWN",
 OBJECTIVE: "→ {floor}",
 TUTORIAL: "▲ stairs top-left · ▼ bottom-right · walk up to a \"!\" apprentice + press [A] · cafe = de-stress",
 RESTART: "PRESS [A] TO RESTART",
 CONNECTING: "RECRUITER ON LINE...",
 LOADING: "LOADING...",
 LOADING_QUIZ: "LOADING CURRICULUM...",
 LOBBY: "LOBBY", CAFE: "CAFE", FLOOR: "F-{num}",
 CHOICE_PROMPT: "SELECT YOUR ANSWER",
 CHOICE_HINT: "↑↓ NAVIGATE · [A] CONFIRM",
 QUESTION_LABEL: "QUESTION",
 TICKET_LABEL: "APPRENTICE'S QUESTION",
 CHOICE_HINT_TOUCH: "TAP AN OPTION OR USE D-PAD",
 CORRECT_FEEDBACK: "Recruiter: \"Exactly. A good mentor.\"",
 WRONG_FEEDBACK: "Recruiter: \"Mmm... not quite. Keep studying.\"",
 TICKET_CORRECT: "Apprentice: \"Now I get it! Thanks, mentor.\"",
 TICKET_WRONG: "Apprentice: \"That doesn't sound right...\"",
 APPRENTICE_NEEDS: "Apprentice on {floor} needs you",
 RECEPTIONIST_HINT: "Receptionist: \"Apprentices wait upstairs. Take the ▲ stairs (top-left).\"",
 BRIEF_LABEL: "RECRUITER",
 BRIEF_HINT: "[A] continue · hold [B] to skip",
 SKIP_HINT_BAR: "Hold [B] to skip the intro",
 SKIPPING: "SKIPPING...",
 CALL_INCOMING: "INCOMING REQUEST",
 CALL_RING: "RIIING...",
 CALL_FLOOR: "Floor: {floor}",
 CALL_TOPIC: "Topic: {topic}",
 CALL_HOW_TO: "Walk to the apprentice and press [A]",
 CALL_DISMISS: "[B] mute",
 FLOOR_FRONTEND: "Frontend",
 FLOOR_BACKEND: "Backend",
 FLOOR_DATA: "Data",
 FLOOR_FRONTEND_SHORT: "Web",
 FLOOR_BACKEND_SHORT: "API",
 FLOOR_DATA_SHORT: "Data",
 BRIEF: [
 "Hi! I'm Iris, recruiter at Arborito Academy.",
 "Your first job here is simple: mentor.",
 "When an apprentice gets stuck, your phone rings and a red \"!\" appears above their head.",
 "Walk over, press [A], and answer the question. Each right answer pays you.",
 "▲ stairs (top-left) go up. ▼ stairs (bottom-right) come down. So keep moving.",
 "Cafeteria when stress climbs. Ready? I'll quiz you first."
 ],
 PROLOGUE: [
 "▓ ARBORITO ACADEMY · MENTOR PROTOCOL ▓",
 "Year 20XX. The Academy hires its new batch of mentors.",
 "Three classroom floors: Frontend, Backend, Data.",
 "Apprentices study there. When one gets stuck, they call.",
 "You answer. You earn. You don't burn out.",
 "First the recruiter wants a chat. Show her you know the material."
 ]
 },
 ES: {
 START_SHIFT: "INICIAR TURNO",
 START_DESC: "ACADEMIA ARBORITO · SIMULADOR DE MENTORÍA.<br>- Cada <b>turno dura ~3 min</b> (mira el reloj ⏱).<br>- Escaleras: <b>▲ SUBE arriba-izq.</b>, <b>▼ BAJA abajo-der.</b><br>- Cuando un aprendiz se atasca te llama: búscalo y responde.<br>- Cafetería = menos estrés. No te quemes.",
 START_DESC_STATIC: "ACADEMIA ARBORITO · MODO ESTÁTICO<br>- Los aprendices hacen preguntas <b>de opción múltiple</b> de tu módulo.<br>- Usa ↑↓ y [A] para responder.<br>- Cada acierto te paga.<br>- Sé buen mentor. No te quemes.",
 MOVE_DESC: "WASD / FLECHAS<br>MOVER",
 ACTION_DESC: "Z / ENTER = A<br>X / ESC = B",
 BACK_LABEL: "VOLVER", ACT_LABEL: "ACCIÓN",
 WELCOME_MSG: "BIENVENIDO A {company}",
 BUSY_MSG: `Aprendiz ({role}): "Estoy estudiando, ¡gracias!"`,
 FUNDS_MSG: "Fondos insuficientes.",
 CONSUMED_MSG: "¡{item} consumido!",
 INCOMING_CALL: "LLAMADA",
 PRESS_A: "PULSA [A]",
 FROM: "DE: {caller}",
 OK: "OK", STRESS: "ESTRÉS",
 SHOP_TITLE: "CAFETERÍA - MENÚ",
 EFFECT: "EFECTO: {stress} Estrés",
 SPEED_BONUS: " + VELOCIDAD",
 BUY: "COMPRAR", EXIT: "SALIR",
 INTERVIEW: "ENTREVISTA",
 RETRY: " (INTENTO #{num})",
 CALL_ENDED: "ENTREVISTA FINALIZADA",
 APPROVED: "APROBADO ({score}/{total})\nBienvenido a {company}.\n(Bono +$200)",
 REJECTED: "RECHAZADO ({score}/{total})\nAún no estás listo para mentorizar.\n¿Intentar de nuevo?",
 CONTINUE: "CONTINUAR",
 EVALUATING: "EVALUANDO...",
 SUBMITTING: "ENVIANDO...",
 EXECUTE: "EJECUTAR",
 TICKET: "PREGUNTA",
 ATTEMPTS: "INTENTOS: {num}",
 SOLUTION_PLACEHOLDER: "RESPUESTA...",
 TICKET_FAILED: `EL APRENDIZ SE FUE CONFUNDIDO. "{reply}"`,
 WRONG_ATTEMPTS: "¡ERROR! INTENTOS: {num}",
 GAME_OVER: "GAME OVER",
 BURNOUT: "BURNOUT - GAME OVER",
 SHIFT_COMPLETE: "¡TURNO COMPLETADO!",
 SHIFT_STATS: "Aprendices: {tickets} · Ganado: ${amount}",
 SHIFT_BREAK_TITLE: "¡TURNO {num} LISTO!",
 SHIFT_BREAK_BODY: "Buen trabajo. Respira hondo.\nAprendices guiados: {tickets}\nGanado: ${amount}\nTotal acumulado: ${total}",
 NEXT_SHIFT: "TURNO {num}",
 NEXT_SHIFT_MSG: "TURNO {num} INICIADO: ¡Suerte!",
 SHIFT_LABEL: "TURNO",
 TIME_LABEL: "TIEMPO",
 STAIR_UP_MSG: "▲ SUBES → {floor}",
 STAIR_DOWN_MSG: "▼ BAJAS → {floor}",
 STAIR_HINT_UP: "▲ SUBE",
 STAIR_HINT_DOWN: "▼ BAJA",
 OBJECTIVE: "→ {floor}",
 TUTORIAL: "▲ arriba-izq · ▼ abajo-der · acércate al aprendiz con \"!\" y pulsa [A] · cafetería = relax",
 RESTART: "PULSA [A] PARA REINICIAR",
 CONNECTING: "RECLUTADORA EN LÍNEA...",
 LOADING: "CARGANDO...",
 LOADING_QUIZ: "CARGANDO MÓDULO...",
 LOBBY: "LOBBY", CAFE: "CAFETERÍA", FLOOR: "P-{num}",
 CHOICE_PROMPT: "ELIGE TU RESPUESTA",
 CHOICE_HINT: "↑↓ NAVEGAR · [A] CONFIRMAR",
 QUESTION_LABEL: "PREGUNTA",
 TICKET_LABEL: "DUDA DEL APRENDIZ",
 CHOICE_HINT_TOUCH: "TOCA UNA OPCIÓN O USA EL D-PAD",
 CORRECT_FEEDBACK: "Reclutadora: \"Exacto. Un buen mentor.\"",
 WRONG_FEEDBACK: "Reclutadora: \"Mmm... no del todo. Sigue estudiando.\"",
 TICKET_CORRECT: "Aprendiz: \"¡Ahora lo entiendo! Gracias, mentor.\"",
 TICKET_WRONG: "Aprendiz: \"Eso no me suena bien...\"",
 APPRENTICE_NEEDS: "Aprendiz en {floor} pide ayuda",
 RECEPTIONIST_HINT: "Recepcionista: \"Los aprendices están arriba. Sube por la escalera ▲ (arriba-izq).\"",
 BRIEF_LABEL: "RECLUTADORA",
 BRIEF_HINT: "[A] continuar · mantén [B] para saltar",
 SKIP_HINT_BAR: "Mantén [B] para saltar la intro",
 SKIPPING: "SALTANDO...",
 CALL_INCOMING: "PETICIÓN ENTRANTE",
 CALL_RING: "RIIING...",
 CALL_FLOOR: "Aula: {floor}",
 CALL_TOPIC: "Tema: {topic}",
 CALL_HOW_TO: "Acércate al aprendiz y pulsa [A]",
 CALL_DISMISS: "[B] silenciar",
 FLOOR_FRONTEND: "Frontend",
 FLOOR_BACKEND: "Backend",
 FLOOR_DATA: "Datos",
 FLOOR_FRONTEND_SHORT: "Web",
 FLOOR_BACKEND_SHORT: "API",
 FLOOR_DATA_SHORT: "Datos",
 BRIEF: [
 "¡Hola! Soy Iris, reclutadora de la Academia Arborito.",
 "Tu primer trabajo aquí es simple: mentorizar.",
 "Cuando un aprendiz se atasca, suena tu teléfono y aparece un \"!\" rojo sobre su cabeza.",
 "Acércate, pulsa [A] y responde su duda. Cada acierto te paga.",
 "▲ (arriba-izq) sube y ▼ (abajo-der) baja. Vas a correr.",
 "Cafetería si subes de estrés. ¿Lista? Primero te entrevisto."
 ],
 PROLOGUE: [
 "▓ ACADEMIA ARBORITO · PROTOCOLO MENTOR ▓",
 "Año 20XX. La Academia recibe a su nueva remesa de mentores.",
 "Tres aulas: Frontend, Backend y Datos.",
 "Los aprendices estudian allí. Cuando uno se atasca: te llama.",
 "Tú respondes. Tú ganas. No te quemas.",
 "Primero la reclutadora quiere hablar. Demuéstrale que sabes."
 ]
 }
};

const lang = (window.arborito?.user?.lang && translations[window.arborito.user.lang.toUpperCase()])
 ? window.arborito.user.lang.toUpperCase() : 'EN';
ensureArboritoMock(lang);
const staticMode = isStaticMode();
const i18n = (key, replacements = {}) => {
 let line = translations[lang][key] || translations['EN'][key] || `[${key}]`;
 for (const [k, v] of Object.entries(replacements)) { line = line.replace(`{${k}}`, v); }
 return line;
};

const shopCatalog = () => lang === 'ES'
 ? [
 { n: 'Café', cost: 40, stress: -20 },
 { n: 'Sandwich', cost: 80, stress: -50 },
 { n: 'Energía', cost: 120, stress: -30, speed: true }
 ]
 : [
 { n: 'Coffee', cost: 40, stress: -20 },
 { n: 'Sandwich', cost: 80, stress: -50 },
 { n: 'Energy', cost: 120, stress: -30, speed: true }
 ];
/** How many frames B must be held during PROLOGUE/BRIEFING to skip the
 * whole intro. ~30 frames at 60fps ≈ 0.5s. Long enough that a tap to
 * advance text doesn't trigger it, short enough to be impatient-friendly. */
const SKIP_HOLD_FRAMES = 30;

/** Phone ring alert duration: ~3 seconds of "loud" ringing, then it
 * collapses to the pinned corner hint. Player can mute earlier with [B]. */
const PHONE_RING_FRAMES = 180;

document.getElementById('btn-start').textContent = i18n('START_SHIFT');
document.getElementById('start-desc').innerHTML = staticMode ? i18n('START_DESC_STATIC') : i18n('START_DESC');
document.getElementById('controls-dpad-desc').innerHTML = i18n('MOVE_DESC');
document.getElementById('controls-action-desc').innerHTML = i18n('ACTION_DESC');
document.getElementById('action-b-label').textContent = i18n('BACK_LABEL');
document.getElementById('action-a-label').textContent = i18n('ACT_LABEL');

class Game {
 constructor() {
 this.canvas = document.getElementById('game-canvas');
 this.ctx = this.canvas.getContext('2d');
 this.ctx.imageSmoothingEnabled = false;

 this.lang = lang;
 this.staticMode = staticMode;
 this.input = new Input();
 this.audio = new AudioSynth();
 this.building = new Building();
 this.paused = false;

 this.logic = new GameLogic(this);
 this.ui = new GameUI(this);
 this.particles = new ParticleSystem();
 this.floatingTexts = new TextManager();

 this.sprites = {
 hero: SpriteGen.hero,
 heroWalk: SpriteGen.heroWalk(0),
 tiles: SpriteGen.tiles,
 recruiter: SpriteGen.recruiterFace
 };
 this.humanCache = {};
 this.state = 'INIT';
 this.frame = 0;
 this.data = {
 company: this.lang === 'ES' ? "Academia Arborito" : "Arborito Academy",
 depts: this.academyDeptNames()
 };
 this.player = { x: 10, y: 6, z: 0, vx: 160, vy: 96, lastMove: 0 };
 this.camera = { x: 0, y: 0 };

 /* phone.ringTimer ticks down while the alert is "ringing" loudly
 (big animated card + sfx). Once it expires the alert collapses
 into a small pinned hint that stays until the player either
 solves the apprentice or the next call comes in. */
 this.phone = {
 active: false,
 ringing: false,
 ringTimer: 0,
 ringTotal: 0,
 timer: 0,
 caller: "",
 floorName: "",
 targetNPC: null,
 topic: "",
 msg: "",
 muted: false
 };
 this.shop = { active: false, items: shopCatalog(), selected: 0 };

 this.briefingLines = translations[this.lang].BRIEF || translations['EN'].BRIEF;
 this.briefingIndex = 0;
 this.briefingCharIndex = 0;
 this.briefingTyping = true;
 /* Hold-B-to-skip during PROLOGUE/BRIEFING. Counted in frames; once
 we cross SKIP_HOLD_FRAMES we jump to the interview state. */
 this.bHoldFrames = 0;

 this.speedBoost = 0;
 this.memories = {};
 this.score = 0;
 this.money = 0;
 this.tasksSolved = 0;
 this.taskAttempts = 5;
 this.stress = 0;
 this.maxStress = 100;
 this.shiftTimer = 0;
 this.shiftNumber = 1;
 this.shiftTicketsStart = 0;
 this.scoreAtShiftStart = 0;
 this.lastShiftTickets = 0;
 this.lastShiftEarned = 0;
 this.msg = { text: "", timer: 0 };

 this.quizPool = [];
 this.usedQuizKeys = new Set();
 this.currentQuiz = null;
 this.currentChoices = [];
 this.choiceSelected = 0;
 this.choiceResolver = null;
 this.prologueLines = translations[this.lang].PROLOGUE || translations['EN'].PROLOGUE;
 this.prologueIndex = 0;
 this.prologueCharIndex = 0;
 this.prologueTyping = true;
 this.interviewQuestions = [];
 this.interviewRound = 0;
 this.interviewScore = 0;

 this.els = {
 taskOverlay: document.getElementById('task-input-layer'),
 taskHeader: document.getElementById('term-header'),
 taskPrompt: document.getElementById('task-prompt-text'),
 taskInput: document.getElementById('task-answer-input'),
 taskSubmit: document.getElementById('btn-submit-task'),
 pauseBtn: document.getElementById('btn-pause'),
 choiceLayer: document.getElementById('choice-layer'),
 choicePrompt: document.getElementById('choice-prompt'),
 choiceOptions: document.getElementById('choice-options'),
 choiceHint: document.getElementById('choice-hint'),
 choiceQuestionBox: document.getElementById('choice-question-box'),
 choiceQuestionLabel: document.getElementById('choice-question-label'),
 choiceQuestionText: document.getElementById('choice-question-text'),
 choiceTopic: document.getElementById('choice-topic')
 };

 this.bindEvents();
 this.init();
 }

 getLine(key, replacements = {}) { return i18n(key, replacements); }

 bindEvents() {
 this.els.taskSubmit.addEventListener('click', () => this.logic.resolveInputSubmission());
 this.els.pauseBtn.addEventListener('click', () => {
 this.paused = !this.paused;
 this.els.pauseBtn.textContent = this.paused ? '▶' : 'II';
 this.els.pauseBtn.style.color = this.paused ? '#22d3ee' : '#155e75';
 });
 this.loop = this.loop.bind(this);
 this.canvas.addEventListener('click', () => {
 this.audio.ensure();
 if (this.state === 'GAMEOVER') window.location.reload();
 });
 }

 async init() {
 this.state = 'PROLOGUE';
 this.audio.ensure();
 requestAnimationFrame(this.loop);

 try {
 const s = await window.arborito.load('career_save_v1');
 if (s) { this.money = s.money || 0; this.tasksSolved = s.tasksSolved || 0; this.memories = s.memories || {}; }
 } catch (_) {}

 try {
 const c = await window.arborito.lesson.next();
 this.contextText = c?.text || 'Office';
 this.contextLesson = c || null;
 } catch (_) {
 this.contextText = lang === 'ES' ? 'Simulador corporativo' : 'Corporate simulator';
 this.contextLesson = null;
 }

 let initLesson = this.contextLesson;
 try {
 if (!initLesson) initLesson = await window.arborito.lesson.at(0);
 } catch (e) {}
 const aiContextBlock = initLesson && window.arborito.lesson?.contextForAi
 ? window.arborito.lesson.contextForAi(initLesson)
 : `Context: "${String(this.contextText || '').substring(0, 400)}"`;

 const aiStatic = this.staticMode;
 let lessonChallenge = null;
 try {
 const lesson = await window.arborito.lesson.at(0);
 lessonChallenge = lesson && lesson.challenge;
 } catch (e) {}

 if (aiStatic) {
 this.state = 'LOADING_QUIZ';
 this.data = {
 company: this.lang === 'ES' ? 'Academia Arborito' : 'Arborito Academy',
 theme: 'corporate',
 depts: this.academyDeptNames()
 };
 setTheme(this.data.theme);
 this.sprites.tiles = SpriteGen.tiles;
 this.sprites.hero = SpriteGen.hero;

 this.quizPool = await loadQuizPool(6);
 if (this.quizPool.length >= 2) {
 this.interviewQuestions = this.quizPool.slice(0, Math.min(4, this.quizPool.length)).map(q => ({
 q: q.q,
 correct: q.correct,
 wrong: q.wrong,
 traps: q.traps,
 options: q.options,
 topic: q.topic,
 lessonId: q.lessonId
 }));
 } else if (lessonChallenge && lessonChallenge.main_question) {
 this.interviewQuestions = [{
 q: lessonChallenge.main_question,
 correct: lessonChallenge.correct_answer || '',
 wrong: (lessonChallenge.traps && lessonChallenge.traps[0]) || '',
 traps: lessonChallenge.traps || [],
 options: lessonChallenge.traps || [],
 topic: lessonChallenge.core_concept || '',
 lessonId: null
 }];
 } else {
 this.interviewQuestions = this.lang === 'ES'
 ? [
 { q: '¿Cuál es el concepto clave del módulo?', correct: 'La respuesta correcta', wrong: 'Una respuesta incorrecta', traps: [] },
 { q: '¿Por qué quieres trabajar en Arborito Corp?', correct: 'Dominar el currículo', wrong: 'No me importa aprender', traps: [] }
 ]
 : [
 { q: 'What is the key concept of the module?', correct: 'The correct answer', wrong: 'A wrong answer', traps: [] },
 { q: 'Why do you want to work at Arborito Corp?', correct: 'Master the curriculum', wrong: 'I do not care about learning', traps: [] }
 ];
 }
 this.state = 'PROLOGUE';
 } else {
 try {
 const json = await window.arborito.ask.json(
 `${aiContextBlock}\n\nTask: Create digital academy profile.\nDepartments must be SHORT classroom topics (≤6 chars each, e.g. "Web", "API", "Data").\nJSON ONLY: { "company": "Name", "theme": "corporate|lab|studio|industrial", "depts": ["D1", "D2", "D3"] }`,
 null,
 { lesson: initLesson, timeoutMs: 90000, maxAttempts: 2 }
);
 if (json && json.company) this.data.company = json.company;
 if (json && Array.isArray(json.depts) && json.depts.length >= 2) {
 /* Truncate any over-long names so the floor panel stays
 readable; the AI can be enthusiastic. */
 this.data.depts = json.depts.slice(0, 4).map(s => String(s || '').slice(0, 7));
 }
 if (json && json.theme) {
 this.data.theme = json.theme;
 setTheme(json.theme);
 this.sprites.tiles = SpriteGen.tiles;
 this.sprites.hero = SpriteGen.hero;
 }
 } catch(e) {}

 try {
 const langName = this.lang === 'ES' ? 'Spanish' : 'English';
 const qs = await window.arborito.ask.json(
 `${aiContextBlock}\n\nTask: Create 6 interview questions in ${langName}.\nJSON ONLY: [{"q": "Question 1"}, ...]`,
 null,
 { lesson: initLesson, timeoutMs: 90000, maxAttempts: 2 }
);
 if(qs && qs.length) this.interviewQuestions = qs.slice(0,6);
 } catch(e) {}
 }
 }

 loop(now) {
 this.frame++;

 if (this.state === 'PROLOGUE' || this.state === 'BRIEFING') {
 this.updateIntroSkipHold();
 if (this.bHoldFrames >= SKIP_HOLD_FRAMES) {
 /* Held long enough : fast-forward through prologue + briefing
 into the interview directly. */
 this.audio.sfxSelect();
 this.bHoldFrames = 0;
 this.skipIntro();
 this.ui.draw();
 requestAnimationFrame(this.loop);
 return;
 }
 }

 if (this.state === 'PROLOGUE') {
 this.tickIntroLine('prologue');
 } else if (this.state === 'BRIEFING') {
 this.tickIntroLine('briefing');
 } else if (this.state === 'GAMEOVER') {
 if (this.input.consume('A')) window.location.reload();
 } else if (this.state === 'SHIFT_BREAK') {
 if (this.input.consume('A')) {
 this.audio.sfxSelect();
 this.startNextShift();
 }
 } else {
 if (!this.paused) {
 this.logic.update(now);
 this.updateCamera();
 this.particles.update();
 this.floatingTexts.update();
 }
 }
 this.ui.draw();
 requestAnimationFrame(this.loop);
 }

 getPrologueLine() {
 const full = this.prologueLines[this.prologueIndex] || '';
 return full.substring(0, this.prologueCharIndex);
 }

 getBriefingLine() {
 const full = this.briefingLines[this.briefingIndex] || '';
 return full.substring(0, this.briefingCharIndex);
 }

 /** Tracks how many consecutive frames B has been held. We don't consume
 * B here : we leave it for tickIntroLine to "tap-advance". The hold
 * threshold is large enough to not trigger on quick taps. */
 updateIntroSkipHold() {
 if (this.input.keys.B) this.bHoldFrames++;
 else this.bHoldFrames = 0;
 }

 /** One ticking frame for the typewriter on prologue or briefing.
 * - [A] taps: while typing, instantly complete the current line; when
 * a line is fully typed, advance to the next.
 * - [B] is reserved for hold-to-skip (handled in loop()), so we
 * deliberately do NOT consume B here. Otherwise browser key
 * auto-repeat would consume B every ~30ms and prevent the hold
 * accumulator from ever reaching SKIP_HOLD_FRAMES.
 */
 tickIntroLine(which) {
 const linesKey = which === 'prologue' ? 'prologueLines' : 'briefingLines';
 const idxKey = which === 'prologue' ? 'prologueIndex' : 'briefingIndex';
 const charKey = which === 'prologue' ? 'prologueCharIndex' : 'briefingCharIndex';
 const typingKey = which === 'prologue' ? 'prologueTyping' : 'briefingTyping';
 const lines = this[linesKey];
 const cur = lines[this[idxKey]] || '';

 if (this.frame % 2 === 0 && this[typingKey] && this[charKey] < cur.length) {
 this[charKey]++;
 } else if (this[charKey] >= cur.length) {
 this[typingKey] = false;
 }

 if (!this.input.consume('A')) return;

 if (this[typingKey]) {
 this[charKey] = cur.length;
 this[typingKey] = false;
 return;
 }

 this.audio.sfxSelect();
 this[idxKey]++;
 this[charKey] = 0;
 this[typingKey] = true;
 if (this[idxKey] >= lines.length) {
 if (which === 'prologue') this.startBriefing();
 else this.startInterviewSequence();
 }
 }

 skipIntro() {
 this.prologueIndex = this.prologueLines.length;
 this.briefingIndex = this.briefingLines.length;
 this.prologueTyping = false;
 this.briefingTyping = false;
 this.startInterviewSequence();
 }

 startBriefing() {
 this.state = 'BRIEFING';
 this.briefingIndex = 0;
 this.briefingCharIndex = 0;
 this.briefingTyping = true;
 this.bHoldFrames = 0;
 }

 startInterviewSequence() {
 if (!this.interviewQuestions || this.interviewQuestions.length === 0) {
 this.interviewQuestions = this.lang === 'ES'
 ? [{ q: '¿Por qué quieres este puesto?' }, { q: '¿Cuál es tu mayor fortaleza?' }]
 : [{ q: 'Why do you want this job?' }, { q: 'What is your strength?' }];
 }
 this.state = 'CONNECTING_CALL';
 this.interviewRound = 0;
 this.interviewScore = 0;
 let ticks = 0;
 const check = setInterval(() => {
 ticks++;
 if (this.interviewQuestions.length > 0) {
 clearInterval(check);
 this.state = 'INTERVIEW_INPUT';
 this.prepareInterviewUI();
 } else if (ticks > 40) {
 clearInterval(check);
 this.state = 'INTERVIEW_INPUT';
 this.prepareInterviewUI();
 }
 }, 500);
 }

 prepareInterviewUI() {
 const q = this.interviewQuestions[this.interviewRound];
 let headerText = `${this.getLine('INTERVIEW')} [${this.interviewRound+1}/${this.interviewQuestions.length}]`;
 if (q.topic) headerText += ` · ${q.topic}`;

 if (this.staticMode) {
 this.state = 'INTERVIEW_CHOICE';
 this.els.taskOverlay.style.display = 'none';
 this.currentQuiz = q;
 this.currentInterviewQuestion = q.q;
 this.showChoices(buildOptions(q, {
 distractorPool: (this.quizPool || []).map((item) => String(item.correct || '').trim()).filter(Boolean),
 lang: this.lang
 }), 'interview', q.q, q.topic);
 } else {
 this.hideChoices();
 this.els.taskOverlay.style.display = 'flex';
 this.els.taskOverlay.classList.add('interview-mode');
 this.els.taskHeader.innerText = headerText;
 this.els.taskPrompt.style.display = 'block';
 this.els.taskPrompt.innerText = `REC: "${q.q}"`;
 this.els.taskInput.style.display = 'block';
 this.els.taskSubmit.style.display = 'block';
 this.els.taskInput.value = '';
 this.els.taskInput.disabled = false;
 this.els.taskInput.focus();
 this.els.taskSubmit.disabled = false;
 this.els.taskSubmit.textContent = this.getLine('EXECUTE');
 }
 }

 showChoices(options, mode = 'task', questionText = '', topic = '') {
 this.currentChoices = options;
 this.choiceSelected = 0;
 this.els.choicePrompt.textContent = this.getLine('CHOICE_PROMPT');
 this.els.choiceHint.textContent = this.getLine('CHOICE_HINT');
 this.els.choiceOptions.innerHTML = '';

 const isInterview = mode === 'interview';
 const isTask = mode === 'task';
 this.els.choiceLayer.classList.remove('interview-choices', 'task-choices');
 if (isInterview) this.els.choiceLayer.classList.add('interview-choices');
 if (isTask) this.els.choiceLayer.classList.add('task-choices');

 const label = isTask ? this.getLine('TICKET_LABEL') : this.getLine('QUESTION_LABEL');
 this.els.choiceQuestionLabel.textContent = label;
 this.els.choiceQuestionText.textContent = questionText || '';
 if (topic) {
 this.els.choiceTopic.textContent = topic;
 this.els.choiceTopic.classList.add('visible');
 } else {
 this.els.choiceTopic.textContent = '';
 this.els.choiceTopic.classList.remove('visible');
 }

 this.els.choiceLayer.classList.add('active');

 options.forEach((opt, i) => {
 const btn = document.createElement('button');
 btn.type = 'button';
 btn.className = 'choice-btn' + (i === 0 ? ' selected' : '');
 btn.dataset.key = String.fromCharCode(65 + i);
 btn.textContent = opt;
 btn.addEventListener('click', () => {
 this.choiceSelected = i;
 this.updateChoiceHighlight();
 this.confirmChoice();
 });
 this.els.choiceOptions.appendChild(btn);
 });
 }

 hideChoices() {
 this.els.choiceLayer.classList.remove('active', 'interview-choices', 'task-choices');
 this.els.choiceOptions.innerHTML = '';
 this.els.choiceQuestionText.textContent = '';
 this.els.choiceTopic.textContent = '';
 this.els.choiceTopic.classList.remove('visible');
 this.currentChoices = [];
 }

 updateChoiceHighlight() {
 const btns = this.els.choiceOptions.querySelectorAll('.choice-btn');
 btns.forEach((btn, i) => btn.classList.toggle('selected', i === this.choiceSelected));
 if (btns[this.choiceSelected]) btns[this.choiceSelected].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
 }

 confirmChoice() {
 if (!this.currentChoices.length) return;
 const picked = this.currentChoices[this.choiceSelected];
 const btns = this.els.choiceOptions.querySelectorAll('.choice-btn');
 if (btns[this.choiceSelected]) btns[this.choiceSelected].classList.add('pressed');
 this.audio.sfxSelect();

 if (this.state === 'INTERVIEW_INPUT' || this.state === 'INTERVIEW_CHOICE') {
 this.hideChoices();
 this.logic.resolveInterview(picked);
 } else if (this.state === 'TYPING_TASK' || this.state === 'TASK_CHOICE') {
 this.logic.resolveGameTask(picked);
 }
 }

 showRecruiterVerdict() {
 this.state = 'INTERVIEW_RESULT';
 this.hideChoices();
 this.els.taskOverlay.classList.remove('interview-mode');
 const passed = this.interviewScore >= Math.ceil(this.interviewQuestions.length / 2);
 this.els.taskOverlay.style.display = 'flex';
 this.els.taskHeader.innerText = this.getLine('CALL_ENDED');
 this.els.taskInput.style.display = 'none';
 this.els.taskPrompt.style.display = 'block';
 this.els.taskSubmit.style.display = 'block';
 this.els.taskSubmit.textContent = this.getLine('CONTINUE');

 if (passed) {
 this.money += 200;
 this.memories.hired = true;
 this.saveGame();
 this.els.taskPrompt.innerText = this.getLine('APPROVED', {score: this.interviewScore, total: this.interviewQuestions.length, company: this.data.company});
 this.els.taskSubmit.onclick = () => { this.startGameWorld(); };
 } else {
 this.memories.rejections = (this.memories.rejections || 0) + 1;
 this.saveGame();
 this.els.taskPrompt.innerText = this.getLine('REJECTED', {score: this.interviewScore, total: this.interviewQuestions.length});
 this.els.taskSubmit.onclick = () => window.location.reload();
 }
 }

 startGameWorld() {
 this.els.taskOverlay.style.display = 'none';
 this.hideChoices();
 this.resetInputUI();

 this.player.z = 0;
 this.building.generate(this.data.depts, {
 lobby: this.getLine('LOBBY'),
 cafe: this.getLine('CAFE')
 });
 const lobby = this.building.floors[0];
 if (lobby?.spawns?.down) {
 this.setPlayerPos(lobby.spawns.down.x, lobby.spawns.down.y);
 }
 this.state = 'PLAY';
 this.shiftNumber = 1;
 this.shiftTimer = 0;
 this.shiftTicketsStart = this.tasksSolved;
 this.scoreAtShiftStart = this.score;
 this.stress = Math.min(this.stress, 40);
 this.showMessage(this.getLine('WELCOME_MSG', { company: this.data.company.toUpperCase() }), 220);
 setTimeout(() => this.showMessage(this.getLine('TUTORIAL'), 320), 2400);

 this.player.vx = this.player.x * CONFIG.TILE;
 this.player.vy = this.player.y * CONFIG.TILE;
 this.camera.x = this.player.vx - (CONFIG.W / 2);
 this.camera.y = this.player.vy - (CONFIG.H / 2);

 if (this.taskInterval) clearInterval(this.taskInterval);
 this.taskInterval = setInterval(() => this.triggerPhoneCall(), 12000);
 }

 startNextShift() {
 this.shiftNumber++;
 this.shiftTimer = 0;
 this.shiftTicketsStart = this.tasksSolved;
 this.scoreAtShiftStart = this.score;
 this.stress = Math.max(0, this.stress - 35);
 this.clearPhoneAlert();
 this.shop.active = false;
 this.state = 'PLAY';
 this.showMessage(this.getLine('NEXT_SHIFT_MSG', { num: this.shiftNumber }), 240);
 if (this.taskInterval) clearInterval(this.taskInterval);
 this.taskInterval = setInterval(() => this.triggerPhoneCall(), Math.max(8000, 12000 - this.shiftNumber * 400));
 }

 setPlayerPos(x, y) {
 this.player.x = x;
 this.player.y = y;
 this.player.vx = x * CONFIG.TILE;
 this.player.vy = y * CONFIG.TILE;
 }

 /** Academy classroom names : short enough to fit the right-side floor
 * panel (≤6 chars) and clear in both languages. */
 academyDeptNames() {
 return this.lang === 'ES'
 ? ['Web', 'API', 'Datos']
 : ['Web', 'API', 'Data'];
 }

 triggerPhoneCall() {
 /* When an apprentice gets stuck:
 1. We pick a random NPC on a classroom floor and flag them with
 a red "!" (handled in drawCallMarker).
 2. We start a *ringing alert* : a phone-shaped notification card
 that pops in, vibrates, plays the ring SFX a few times, then
 shrinks into a small pinned hint. The card is non-modal: the
 player can keep moving and just walk to the apprentice. */
 if (this.state !== 'PLAY' || this.phone.targetNPC || this.paused || this.shop.active) return;
 if (!this.building.floors || this.building.floors.length <= 2) return;

 const officeFloors = this.building.floors.slice(2);
 if (officeFloors.length === 0) return;
 const floorIdx = Math.floor(Math.random() * officeFloors.length) + 2;
 const floor = this.building.floors[floorIdx];
 if (!floor || !floor.npcs || floor.npcs.length === 0) return;

 const npc = floor.npcs[Math.floor(Math.random() * floor.npcs.length)];
 this.phone.targetNPC = npc;
 this.phone.active = false;
 this.phone.ringing = true;
 this.phone.ringTimer = PHONE_RING_FRAMES;
 this.phone.ringTotal = PHONE_RING_FRAMES;
 this.phone.muted = false;
 this.phone.caller = npc.role || 'Apprentice';
 this.phone.floorName = floor.name;

 let msgTopic = this.lang === 'ES' ? 'Concepto del módulo' : 'Module concept';
 if (this.staticMode && this.quizPool.length > 0) {
 const preview = pickUnusedFromPool(this.quizPool, this.usedQuizKeys);
 if (preview) msgTopic = preview.topic || msgTopic;
 }
 this.phone.topic = msgTopic;
 this.phone.msg = this.getLine('APPRENTICE_NEEDS', { floor: floor.name });
 npc.task = { type: 'TICKET' };

 /* Stagger 3 rings ~600ms apart so it actually sounds like a phone. */
 this.audio.sfxPhone();
 setTimeout(() => { if (this.phone.ringing) this.audio.sfxPhone(); }, 700);
 setTimeout(() => { if (this.phone.ringing) this.audio.sfxPhone(); }, 1400);
 }

 /** Called every frame from logic.updateSystem. Counts down the loud
 * ring portion of the alert; when it hits 0 the alert collapses to
 * the small pinned hint. Player can mute early with [B]. */
 tickPhoneRing() {
 if (!this.phone.ringing) return;
 if (this.input.consume('B')) {
 this.phone.ringing = false;
 this.phone.muted = true;
 this.audio.sfxSelect();
 return;
 }
 this.phone.ringTimer--;
 if (this.phone.ringTimer <= 0) {
 this.phone.ringing = false;
 }
 }

 clearPhoneAlert() {
 this.phone.targetNPC = null;
 this.phone.ringing = false;
 this.phone.active = false;
 this.phone.ringTimer = 0;
 this.phone.muted = false;
 this.phone.topic = '';
 this.phone.msg = '';
 }

 async startMinigame(npc) {
 this.state = 'LOADING_TASK';
 this.currentNPC = npc;
 this.audio.sfxSelect();
 this.taskAttempts = 5;
 this.clearPhoneAlert();

 let q = { role: npc.role, complaint: "Broken system.", correct: '', lessonId: null };
 const langName = this.lang === 'ES' ? 'Spanish' : 'English';

 if (this.staticMode) {
 const quizItem = this.quizPool.length > 0 ? pickUnusedFromPool(this.quizPool, this.usedQuizKeys) : null;
 if (quizItem) {
 q = {
 role: npc.role,
 complaint: this.lang === 'ES'
 ? `[${quizItem.topic}] ${quizItem.complaint}`
 : `[${quizItem.topic}] ${quizItem.complaint}`,
 correct: quizItem.correct,
 wrong: quizItem.wrong,
 traps: quizItem.traps,
 options: quizItem.options,
 topic: quizItem.topic,
 lessonId: quizItem.lessonId,
 q: quizItem.q
 };
 } else {
 const snippet = (this.contextText || '').substring(0, 120);
 q = {
 role: npc.role,
 complaint: snippet
 ? (this.lang === 'ES' ? `Fallo en: ${snippet}` : `Failure in: ${snippet}`)
 : (this.lang === 'ES' ? 'El sistema no responde.' : 'The system is not responding.'),
 correct: '', wrong: '', traps: [], options: []
 };
 }
 } else {
 try {
 let lesson = null;
 if (quizItem?.lessonId) {
 try { lesson = await window.arborito.lesson.byId(quizItem.lessonId); } catch (_) {}
 }
 if (!lesson) {
 try { lesson = await window.arborito.lesson.at(0); } catch (_) {}
 }
 const ctx = lesson && window.arborito.lesson?.contextForAi
 ? window.arborito.lesson.contextForAi(lesson)
 : `Context: "${this.contextText.substring(0, 400)}"`;
 q = await window.arborito.ask.json(
 `${ctx}\n\nCreate a support ticket complaint for ${npc.role} in ${langName}. JSON: {"role":"", "complaint":""}`,
 null,
 { lesson, timeoutMs: 90000, maxAttempts: 2 }
);
 } catch(e) {}
 }

 this.currentTaskData = q;
 this.currentQuiz = q;
 this.state = this.staticMode ? 'TASK_CHOICE' : 'TYPING_TASK';

 if (this.staticMode && q.correct) {
 this.els.taskOverlay.style.display = 'none';
 this.showChoices(buildOptions(q, {
 distractorPool: (this.quizPool || []).map((item) => String(item.correct || '').trim()).filter(Boolean),
 lang: this.lang
 }), 'task', q.complaint || q.q || '', q.topic || '');
 this.currentTicketComplaint = q.complaint;
 } else {
 this.hideChoices();
 this.els.taskOverlay.style.display = 'flex';
 this.els.taskHeader.innerText = `${this.getLine('TICKET')}: ${npc.role.toUpperCase()} | ${this.getLine('ATTEMPTS', {num: this.taskAttempts})}`;
 this.els.taskPrompt.style.display = 'block';
 this.els.taskPrompt.innerText = `"${q.complaint}"`;
 this.els.taskInput.style.display = 'block';
 this.els.taskSubmit.style.display = 'block';
 this.els.taskInput.value = '';
 this.els.taskInput.placeholder = this.getLine('SOLUTION_PLACEHOLDER');
 this.els.taskInput.disabled = false;
 this.els.taskInput.focus();
 }
 }

 updateCamera() {
 const pX = this.player.vx; const pY = this.player.vy;
 let targetCX = pX - (CONFIG.W / 2) + (CONFIG.TILE/2) + 20;

 if (this.building && this.building.floors && this.building.floors[this.player.z]) {
 const floor = this.building.floors[this.player.z];
 const maxW = (floor.map[0].length * CONFIG.TILE);
 const maxH = (floor.map.length * CONFIG.TILE);
 targetCX = Math.max(0, Math.min(targetCX, maxW - CONFIG.W + 40));
 const targetCY = Math.max(0, Math.min(pY - (CONFIG.H/2), maxH - CONFIG.H));
 this.camera.x += (targetCX - this.camera.x) * 0.08;
 this.camera.y += (targetCY - this.camera.y) * 0.08;
 }
 }

 getHumanSprite(shirt, hair, isVendor) {
 const k = `${shirt}-${hair}-${!!isVendor}`;
 if (!this.humanCache[k]) this.humanCache[k] = SpriteGen.human(shirt, hair, isVendor);
 return this.humanCache[k];
 }
 showMessage(txt, duration = 200) { this.msg.text = txt; this.msg.timer = duration; }
 saveGame() {
 try { window.arborito.save('career_save_v1', { money: this.money, tasksSolved: this.tasksSolved, memories: this.memories }); } catch (_) {}
 }
 setTaskLoading(isLoading, txt) {
 this.els.taskSubmit.disabled = isLoading;
 this.els.taskSubmit.textContent = isLoading ? (txt || this.getLine('SUBMITTING')) : this.getLine('EXECUTE');
 this.els.taskInput.disabled = isLoading;
 if (isLoading) this.hideChoices();
 }
 resetInputUI() {
 this.els.taskSubmit.onclick = () => this.logic.resolveInputSubmission();
 }
}

document.getElementById('btn-start').addEventListener('click', () => {
 document.getElementById('start-screen').style.display = 'none';
 new Game();
});
