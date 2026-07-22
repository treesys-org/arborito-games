import { SeededRandom, rectIntersect, Sprites, bindMobileTap } from './utils.js';

const BOSS_NAMES = ['Eco del Vacío', 'Sombra Primordial', 'Cantor del Olvido'];

const SPEAKER_NAMES = {
 ES: { elder: 'Anciano Marciano', scholar: 'Erudito Marciano', beacon_npc: 'Técnico Marciano' },
 EN: { elder: 'Martian Elder', scholar: 'Martian Scholar', beacon_npc: 'Martian Technician' },
};

function npcSpeaker(type, lang = planetLangCode()) {
 const table = SPEAKER_NAMES[lang] || SPEAKER_NAMES.EN;
 return table[type] || type;
}

const SCHOLAR_LINES = {
 ES: [
 'Las Sombras robaron nuestros cristales de saber. Sin ellos, olvidamos lo esencial.',
 'He visto sombras moverse entre las rocas… evítalas o destrúyelas con tu bláster.',
 'Cada cristal que recuperes devuelve una parte de nuestra memoria colectiva.',
 ],
 EN: [
 'The Shadows stole our knowledge crystals. Without them, we forget what matters.',
 'I have seen shadows moving among the rocks… avoid them or blast them.',
 'Every crystal you recover restores part of our collective memory.',
 ],
};

const PLANET_COPY = {
 ES: {
 elderQuest: 'Las Sombras del Coro, los Ecos del Vacío, robaron nuestros cristales. Habla con cada sabio, recupera 3 cristales y silencia al Eco mayor al este. Luego vuelve a tu nave.',
 elderProgress: 'Aún faltan cristales ({n}/{req}). Brillan con luz cian cerca de las ruinas y los lagos.',
 elderBoss: 'La resonancia está completa. El Eco del Vacío, el jefe del sector, aguarda al este.',
 elderDone: 'El Nexo está estable. Ve al faro verde y despega desde tu nave.',
 elderNeedTalk: 'Todavía hay sabios esperándote en el camino. Salúdalos a todos.',
 scholarAsk: 'Si respondes bien, compartiré munición del archivo. Puedes volver cuando quieras.',
 scholarGift: '¡Correcto! Aquí tienes munición.',
 scholarWrong: 'No era esa. Vuelve cuando quieras intentarlo otra vez.',
 scholarNoQuiz: 'Toma un poco de munición del archivo. ¡Suerte contra las Sombras!',
 beaconLocked: 'El Nexo sigue bloqueado. Primero silencia al Eco del Vacío.',
 beaconNeedTalk: 'Antes de partir, habla con todos los marcianos del sector.',
 beaconReady: 'Nexo listo. Vuelve a tu nave para despegar.',
 crystalsFound: '¡{n} cristales! El Eco del Vacío se manifiesta al final del sector.',
 bossDefeated: '¡Eco silenciado! Si ya hablaste con todos, despega desde la nave.',
 nexoBlocked: 'Primero derrota al Eco del Vacío.',
 shipNeedTalk: 'Aún faltan marcianos. Recorre el sector y habla con ellos.',
 shipNeedBoss: 'Queda energía hostil: derrota al Eco del Vacío al este.',
 objTalkElder: 'Habla con el Anciano cerca de tu nave.',
 objTalkAll: 'Habla con todos los marcianos ({n}/{total}).',
 objCrystals: 'Recupera cristales ({n}/{req}).',
 objBoss: 'Derrota al Eco del Vacío al este.',
 objLaunch: 'Vuelve a la nave y despega.',
 promptTalk: 'Hablar',
 promptLaunch: 'Despegar',
 fxAmmo: '+{n} munición',
 fxCrystal: 'Cristal recuperado ({n}/{req})',
 fxMartian: 'Sabio contactado ({n}/{total})',
 fxBoss: '¡Eco del Vacío derrotado!',
 fxReady: 'Listo para despegar',
 },
 EN: {
 elderQuest: 'Choir Shadows, Void Echoes, stole our crystals. Speak with every sage, recover 3 crystals, silence the greater Echo to the east, then return to your ship.',
 elderProgress: 'Crystals still missing ({n}/{req}). They glow cyan near ruins and lakes.',
 elderBoss: 'Resonance complete. The Void Echo, the sector boss, waits east.',
 elderDone: 'Nexus stable. Reach the green beacon, then launch from your ship.',
 elderNeedTalk: 'Some sages still await you along the path. Greet them all.',
 scholarAsk: 'Answer well and I will share archive ammo. You can return anytime.',
 scholarGift: 'Correct! Take this ammo.',
 scholarWrong: 'Not that one. Come back whenever you want another try.',
 scholarNoQuiz: 'Take some archive ammo. Good luck against the Shadows!',
 beaconLocked: 'Nexus still locked. Silence the Void Echo first.',
 beaconNeedTalk: 'Talk to every Martian in the sector before leaving.',
 beaconReady: 'Nexus ready. Return to your ship to launch.',
 crystalsFound: '{n} crystals! The Void Echo manifests at the sector end.',
 bossDefeated: 'Echo silenced! If you spoke with everyone, launch from the ship.',
 nexoBlocked: 'Defeat the Void Echo first.',
 shipNeedTalk: 'Martians remaining. Explore and talk to them.',
 shipNeedBoss: 'Hostile energy remains: defeat the Void Echo to the east.',
 objTalkElder: 'Talk to the Elder near your ship.',
 objTalkAll: 'Talk to every Martian ({n}/{total}).',
 objCrystals: 'Recover crystals ({n}/{req}).',
 objBoss: 'Defeat the Void Echo to the east.',
 objLaunch: 'Return to the ship and launch.',
 promptTalk: 'Talk',
 promptLaunch: 'Launch',
 fxAmmo: '+{n} ammo',
 fxCrystal: 'Crystal recovered ({n}/{req})',
 fxMartian: 'Sage contacted ({n}/{total})',
 fxBoss: 'Void Echo defeated!',
 fxReady: 'Ready to launch',
 },
};

function planetLangCode() {
 const u = window.arborito && window.arborito.user && window.arborito.user.lang;
 return String(u || 'EN').toUpperCase() === 'ES' ? 'ES' : 'EN';
}

function planetCopy(key, vars = {}, lang = planetLangCode()) {
 const table = PLANET_COPY[lang] || PLANET_COPY.EN;
 let s = table[key] || PLANET_COPY.EN[key] || '';
 for (const [k, v] of Object.entries(vars)) {
 s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
 }
 return s;
}

function buildElderGreeting(title, lessonText, lang = planetLangCode()) {
 const snippet = pickSentence(lessonText, { min: 24, max: 80 });
 const topic = snippet
 ? (lang === 'ES' ? ` sobre "${snippet}"` : ` about "${snippet}"`)
 : '';
 if (lang === 'ES') {
 return `¡Viajero! Las Sombras robaron cristales${topic}. Habla con todos, recupera 3, derrota al Eco y vuelve a la nave.`;
 }
 return `Traveler! Shadows stole the crystals${topic}. Talk to all Martians, recover 3, defeat the Echo, return to ship.`;
}

function buildScholarLine(sentences, index, title, lang = planetLangCode()) {
 if (sentences.length > 0) {
 const raw = sanitizeLessonText(sentences[index % sentences.length]);
 const trimmed = raw.replace(/[.!?]+$/, '').trim();
 if (trimmed.length >= 24 && trimmed.length <= 140 && trimmed.split(/\s+/).length >= 5) {
 return lang === 'ES'
 ? `En este mundo aprendimos: ${trimmed}.`
 : `On this world we learned: ${trimmed}.`;
 }
 }
 const pool = SCHOLAR_LINES[lang] || SCHOLAR_LINES.EN;
 return pool[index % pool.length];
}

/** Strip backend tags (@quiz blocks, @-meta), markdown, code fences and other author markup
 * so on-planet NPC dialogue reads as natural prose, not a debug dump. */
function sanitizeLessonText(raw) {
 const api = window.arborito && window.arborito.lesson;
 if (api && typeof api.plainText === 'function') {
 return api.plainText(raw);
 }
 let s = String(raw || '');
 s = s.replace(/^@\w+\s*\n[\s\S]*?^@\/\w+\s*$/gim, ' ');
 s = s.replace(/^@quiz\s*\n[\s\S]*?^@\/quiz\s*$/gim, ' ');
 s = s.replace(/<[^>]*>/g, ' ');
 s = s.replace(/```[\s\S]*?```/g, ' ');
 s = s.replace(/`[^`]*`/g, ' ');
 s = s.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1');
 s = s.replace(/@[A-Za-z_/][\w-/]*/g, ' ');
 s = s.replace(/^[a-z][a-z0-9_-]*:\s*.+$/gim, ' ');
 s = s.replace(/[#*_>~|`]/g, ' ');
 s = s.replace(/https?:\/\/\S+/g, ' ');
 s = s.replace(/\s+/g, ' ').trim();
 return s;
}

/** Find a self-contained sentence between minLen..maxLen characters that
 * actually reads like a sentence (letters + word count > 4). */
function pickSentence(text, { min = 24, max = 140 } = {}) {
 const clean = sanitizeLessonText(text);
 if (!clean) return '';
 const sentences = clean.split(/(?<=[.!?])\s+/);
 for (const raw of sentences) {
 const s = raw.trim().replace(/[.!?]+$/, '').trim();
 if (s.length < min || s.length > max) continue;
 if (!/[a-záéíóúñü]/i.test(s)) continue;
 if (s.split(/\s+/).length < 5) continue;
 return s;
 }
 return '';
}

/** Append hex alpha to #rgb/#rrggbb; convert hsl() to hsla(). */
function withAlpha(color, hexAlpha) {
 if (!color) return '#000000' + hexAlpha;
 if (color.startsWith('#')) {
 return color.length > 7 ? color : color + hexAlpha;
 }
 if (color.startsWith('hsl(')) {
 const val = parseInt(hexAlpha, 16) / 255;
 return color.replace('hsl', 'hsla').replace(')', `, ${val.toFixed(2)})`);
 }
 return color;
}

export class PlatformerEngine {
 constructor(game) {
 this.game = game;
 this.player = {
 x: 100, y: 0, w: 32, h: 48,
 vx: 0, vy: 0,
 grounded: false,
 health: 100, maxHealth: 100,
 ammo: 0,
 facing: 1,
 animFrame: 0,
 state: 'idle',
 invuln: 0,
 };
 this.camera = { x: 0, y: 0 };
 this.zoom = 1.75;

 this.tiles = [];
 this.npcs = [];
 this.enemies = [];
 this.props = [];
 this.projectiles = [];
 this.shipObj = null;

 this.levelWidth = 0;
 this.tileSize = 48;

 this.gravity = 0.8;
 this.moveSpeed = 6.0;
 this.jumpForce = -15;

 this.ui = {
 layer: document.getElementById('ui-planet'),
 dialogueBox: document.getElementById('dialogue-box'),
 dialogueText: document.getElementById('dialogue-text'),
 dialogueSpeaker: document.getElementById('dialogue-speaker'),
 dialogueQuiz: document.getElementById('dialogue-quiz'),
 healthFill: document.getElementById('health-fill'),
 ammoDisplay: document.getElementById('ammo-display'),
 planetObjective: document.getElementById('planet-objective'),
 contextPrompt: document.getElementById('context-prompt'),
 deathScreen: document.getElementById('death-screen'),
 btnInteract: document.getElementById('btn-interact')
 };

 this.isLoading = false;
 this.bindTouchControls();

 this.dialogueQueue = [];
 this.activeDialogue = null;
 this.interactingNPC = null;
 this.crystals = [];
 this.crystalsCollected = 0;
 this.crystalsRequired = 3;
 this.boss = null;
 this.bossDefeated = false;
 this.levelComplete = false;
 this.hazards = [];
 this.logs = [];
 this.lessonQuizzes = [];
 this.quizCursor = 0;
 this.activeQuiz = null;

 this.theme = { ground: '#334155', sky: '#0f172a', bgMount: '#1e293b' };
 }

 bindTouchControls() {
 const bind = (id, key) => {
 const el = document.getElementById(id);
 if(!el) return;

 const handleStart = (e) => {
 e.preventDefault();
 this.game.input.setKey(key, true);
 el.style.opacity = '1';
 el.style.transform = 'scale(0.95)';
 };

 const handleEnd = (e) => {
 e.preventDefault();
 this.game.input.setKey(key, false);
 el.style.opacity = '0.6';
 el.style.transform = 'scale(1)';
 };

 el.addEventListener('touchstart', handleStart);
 el.addEventListener('touchend', handleEnd);
 el.addEventListener('touchcancel', handleEnd);
 el.addEventListener('mousedown', handleStart);
 el.addEventListener('mouseup', handleEnd);
 el.addEventListener('mouseleave', handleEnd);
 };

 bind('btn-left', 'ArrowLeft');
 bind('btn-right', 'ArrowRight');
 bind('btn-jump', 'ArrowUp');
 bind('btn-shoot', 'r');
 bind('btn-interact', 'ArrowUp');

 bindMobileTap(this.ui.dialogueBox, () => {
 if (this.activeQuiz) return;
 if (!this.activeDialogue) return;
 this.activeDialogue = null;
 this.ui.dialogueBox.style.display = 'none';
 document.body.classList.remove('dialogue-open');
 });
 }

 /** Build multiple-choice cards from the planet lesson for Martian ammo quizzes. */
 buildLessonQuizzes(lesson) {
 const api = window.arborito?.challenge;
 if (!api?.fromLesson || !lesson) return [];
 const modes = api.modes;
 const lang = planetLangCode();
 const challenges = api.fromLesson(lesson) || [];
 const distractorPool = [];
 const seenAns = new Set();
 for (const c of challenges) {
 const play = modes?.challengeForPlay?.(c) || c;
 const ans = String(play?.correct_answer || play?.short_definition || '').trim();
 if (!ans) continue;
 const key = ans.toLowerCase();
 if (seenAns.has(key)) continue;
 seenAns.add(key);
 distractorPool.push(ans);
 }
 const out = [];
 for (const c of challenges) {
 const playable = modes?.playable?.(c) || [];
 const mode = playable.includes('multiple') ? 'multiple' : playable[0];
 if (!mode) continue;
 const card = modes.buildCard(c, mode, { lessonTitle: lesson.title, lang, distractorPool });
 if (!card?.correct) continue;
 const correct = String(card.correct).trim();
 let options = (card.options || [])
 .map(String)
 .map((s) => s.trim())
 .filter((s) => s && s !== ': ' && s !== '\u2014' && s !== '…' && s !== '...');
 if (!options.includes(correct)) options.unshift(correct);
 if (options.length < 2) {
 const siblings = distractorPool.filter((a) => a.toLowerCase() !== correct.toLowerCase());
 options = [correct, ...siblings].slice(0, 4);
 }
 while (options.length < 2) {
 options.push(lang === 'ES' ? `Incorrecto ${options.length}` : `Wrong ${options.length}`);
 }
 const uniq = [...new Set(options)];
 out.push({
 question: card.question || lesson.title,
 correct,
 options: uniq.slice(0, 4).sort(() => Math.random() - 0.5),
 challenge: c,
 });
 }
 return out;
 }

 loadLevel(planet) {
 this.ui.layer.classList.remove('hidden');
 this.ui.deathScreen.classList.add('hidden');
 this.planet = planet;

 this.theme = {
 ground: planet.color || '#334155',
 sky: '#0b1220',
 bgMount: '#1a2332',
 accent: planet.color || '#334155',
 biomes: {
 dawn: { ground: '#3f5d45', sky: '#0a1a12', mount: '#14241a', hazard: '#166534', log: '#854d0e' },
 mid: { ground: '#475569', sky: '#0b1220', mount: '#1a2332', hazard: '#1e3a5f', log: '#78716c' },
 dusk: { ground: '#6b3a2e', sky: '#1a0c10', mount: '#2a1418', hazard: '#9f1239', log: '#44403c' },
 },
 };

 const fallbackData = {
 title: planet.data.title,
 text: 'Los Sabios Marcianos guardaron este conocimiento en cristales resonantes.'
 };

 this.generateWorld(fallbackData, {
 elder_greeting: buildElderGreeting(planet.data.title, planet.data.text || fallbackData.text, planetLangCode())
 });

 if (window.arborito && window.arborito.lesson) {
 const idx = planet.data.index !== undefined ? planet.data.index : 0;
 window.arborito.lesson.at(idx).then(async (lessonData) => {
 const elderFallback = buildElderGreeting(lessonData.title, lessonData.text);
 let elderGreeting = elderFallback;

 const aiStatic = window.arborito.getAIMode && window.arborito.getAIMode() === 'static';
 if (aiStatic && lessonData.challenge) {
 const c = lessonData.challenge;
 const hint = c.short_definition || c.core_concept || '';
 elderGreeting = buildElderGreeting(lessonData.title, hint || lessonData.text);
 } else if (window.arborito.getAIMode && window.arborito.getAIMode() === 'dynamic' && window.arborito.ask?.json) {
 try {
 const userLang = (window.arborito.user?.lang || 'EN').toUpperCase();
 const langName = userLang === 'ES' ? 'Spanish' : 'English';
 const ctx = window.arborito.lesson.contextForAi
 ? window.arborito.lesson.contextForAi(lessonData)
 : `Lesson: "${lessonData.title}". Excerpt: "${(lessonData.text || '').substring(0, 200)}"`;
 const prompt = `${ctx}\n\nWrite an RPG dialogue in ${langName} for a desperate Martian Elder.
Scenario: Void Choir shadows stole the Data Crystals.
The elder asks the traveler to recover 3 crystals, defeat the boss, and return to the ship.
Briefly mention why this knowledge is vital for their civilization.
Output JSON: { "elder_greeting": "..." }`;
 const storyContext = await window.arborito.ask.json(prompt, null, {
 lesson: lessonData,
 timeoutMs: 90000,
 maxAttempts: 2,
 });
 if (storyContext?.elder_greeting) elderGreeting = storyContext.elder_greeting;
 } catch (e) {}
 }

 this.applyLessonDialogue(lessonData, elderGreeting);
 this.lessonQuizzes = this.buildLessonQuizzes(lessonData);
 this.quizCursor = 0;
 }).catch(e => {
 console.warn('arborito lesson load error', e);
 });
 }
 }

 applyLessonDialogue(data, elderGreeting) {
 const cleanText = sanitizeLessonText(data.text);
 const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
 let scholarIdx = 0;

 this.npcs.forEach(npc => {
 if (npc.type === 'elder') {
 npc.text = elderGreeting;
 } else if (npc.type === 'scholar') {
 npc.text = buildScholarLine(sentences, scholarIdx, data.title, planetLangCode());
 scholarIdx++;
 }
 });
 }

 surfaceYAt(tileX) {
 if (!this.surfaceHeights) return 12 * this.tileSize;
 const col = Math.floor(tileX / this.tileSize);
 const clamped = Math.max(0, Math.min(this.surfaceHeights.length - 1, col));
 return this.surfaceHeights[clamped] * this.tileSize;
 }

 generateWorld(data, storyContext) {
 try {
 const sectorIdx = this.planet?.data?.index ?? 0;
 const rng = new SeededRandom(`${data.title}::${sectorIdx}`);
 const lang = planetLangCode();

 const cleanText = sanitizeLessonText(data.text);
 const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
 this.lessonSentences = sentences;

 this.tiles = [];
 this.tilesByCol = [];
 this.npcs = [];
 this.enemies = [];
 this.props = [];
 this.projectiles = [];
 this.activeDialogue = null;
 this.ui.dialogueBox.style.display = 'none';
 this.crystals = [];
 this.crystalsCollected = 0;
 this.bossDefeated = false;
 this.levelComplete = false;
 this.hazards = [];
 this.logs = [];
 this.activeQuiz = null;
 this.clearQuizUi();
 this.levelWidth = 6800 + (sectorIdx % 3) * 600;
 this.surfaceHeights = [];

 const groundY = 12;
 const numCols = Math.floor(this.levelWidth / this.tileSize);
 const safeCols = 20;
 const bossArenaStart = numCols - 16;
 /** Max platform lift reachable with jump (~2.9 tiles). */
 const MAX_REACHABLE_LIFT = 2;

 for (let x = 0; x < numCols; x++) {
 let height = groundY;
 const n1 = (rng.noise(x * 0.07) - 0.5) * 5;
 const n2 = (rng.noise(x * 0.018 + 40) - 0.5) * 2.5;
 height += Math.round(n1 + n2);

 const canyonMid = Math.floor(numCols * 0.42);
 if (Math.abs(x - canyonMid) <= 3) height += 2;

 if (x < safeCols) height = groundY;
 if (x >= bossArenaStart) height = groundY + (x >= numCols - 10 ? 0 : 1);

 height = Math.max(7, Math.min(17, height));
 this.surfaceHeights[x] = height;

 for (let y = height; y < 20; y++) {
 const type = y === height ? 'surface' : 'deep';
 let deco = 0;
 if (type === 'surface') {
 const roll = rng.next();
 if (roll > 0.72) deco = 1;
 else if (roll > 0.58) deco = 2;
 else if (roll > 0.52) deco = 3;
 }

 this.tiles.push({
 x: x * this.tileSize,
 y: y * this.tileSize,
 w: this.tileSize,
 h: this.tileSize,
 type,
 deco,
 biome: x < numCols * 0.33 ? 'dawn' : x < numCols * 0.66 ? 'mid' : 'dusk',
 });
 }
 }

 const addPlatformRun = (startCol, span, lift) => {
 for (let i = 0; i < span; i++) {
 const col = startCol + i;
 if (col <= safeCols || col >= bossArenaStart) continue;
 const h = this.surfaceHeights[col];
 this.tiles.push({
 x: col * this.tileSize,
 y: (h - lift) * this.tileSize,
 w: this.tileSize,
 h: this.tileSize,
 type: 'plat',
 });
 }
 };

 addPlatformRun(Math.floor(numCols * 0.26), 4, 2);
 addPlatformRun(Math.floor(numCols * 0.38), 3, 2);
 addPlatformRun(Math.floor(numCols * 0.54), 5, 2);
 addPlatformRun(Math.floor(numCols * 0.68), 4, 2);

 // Biome hazards: grove creek, ruins canal, toxic lake, hop floating logs.
 const carveHazard = (startFrac, widthCols, kind) => {
 const start = Math.floor(numCols * startFrac);
 const end = Math.min(bossArenaStart - 2, start + widthCols);
 if (start <= safeCols + 2) return;
 const biome = kind === 'grove' ? 'dawn' : kind === 'canal' ? 'mid' : 'dusk';
 for (let col = start; col < end; col++) {
 const surfaceY = this.surfaceHeights[col] * this.tileSize;
 this.hazards.push({
 x: col * this.tileSize,
 y: surfaceY - 18,
 w: this.tileSize,
 h: 22,
 type: kind,
 biome,
 });
 }
 const logCount = Math.max(2, Math.floor((end - start) / 3));
 for (let i = 0; i < logCount; i++) {
 const col = start + 1 + i * 3;
 if (col >= end - 1) break;
 const surfaceY = this.surfaceHeights[col] * this.tileSize;
 this.logs.push({
 x: col * this.tileSize + 4,
 y: surfaceY - 36,
 w: this.tileSize - 8,
 h: 14,
 vx: (i % 2 === 0 ? 0.55 : -0.55),
 minX: start * this.tileSize,
 maxX: (end - 1) * this.tileSize,
 biome,
 });
 }
 };
 carveHazard(0.22, 7, 'grove');
 carveHazard(0.48, 8, 'canal');
 carveHazard(0.72, 9, 'toxic');

 const placeScholar = (col, scholarIndex) => {
 if (col <= safeCols || col >= bossArenaStart - 2) return null;
 const surfaceY = this.surfaceHeights[col] * this.tileSize;
 const px = col * this.tileSize - 20;
 this.props.push({ x: px, y: surfaceY - 80, type: 'hut', w: 100, h: 80 });
 this.props.push({ x: px + 90, y: surfaceY - 55, type: 'pillar', w: 16, h: 48 });
 const npc = {
 x: col * this.tileSize + 20,
 y: surfaceY - 48,
 w: 32,
 h: 48,
 text: buildScholarLine(sentences, scholarIndex, data.title, lang),
 type: 'scholar',
 talked: false,
 };
 this.npcs.push(npc);
 return { col, surfaceY, npc };
 };

 const scholarA = placeScholar(Math.floor(numCols * 0.30), 0);
 const scholarB = placeScholar(Math.floor(numCols * 0.56), 1);
 // Third Martian so "talk to all" feels like a real sweep of the map.
 const scholarC = placeScholar(Math.floor(numCols * 0.78), 2);

 const enemyCols = [
 Math.floor(numCols * 0.40),
 Math.floor(numCols * 0.50),
 Math.floor(numCols * 0.64),
 Math.floor(numCols * 0.76),
 ];
 enemyCols.forEach((col) => {
 if (col <= safeCols + 4 || col >= bossArenaStart - 2) return;
 const surfaceY = this.surfaceHeights[col] * this.tileSize;
 this.enemies.push({
 x: col * this.tileSize,
 y: surfaceY - 32,
 w: 32,
 h: 32,
 vx: 0,
 vy: 0,
 type: 'blob',
 aggro: false,
 startX: col * this.tileSize,
 });
 });

 const spawnX = 220;
 const shipX = 100;
 const elderX = 360;
 const shipSurfaceY = this.surfaceYAt(shipX);
 const elderSurfaceY = this.surfaceYAt(elderX);
 const spawnSurfaceY = this.surfaceYAt(spawnX);

 this.shipObj = { x: shipX, y: shipSurfaceY - 64 + 10, w: 64, h: 64 };

 const elderText = storyContext?.elder_greeting || buildElderGreeting(data.title, data.text, lang);
 this.npcs.unshift({
 x: elderX,
 y: elderSurfaceY - 64,
 w: 32,
 h: 64,
 text: elderText,
 type: 'elder',
 questGiven: false,
 talked: false,
 });

 this.props.unshift({ x: elderX - 30, y: elderSurfaceY - 80, type: 'hut', w: 100, h: 80 });

 // Crystals only on ground or low platforms the jump can reach.
 const crystalSpots = [];
 const pushReachable = (x, surfaceY, liftTiles = 0) => {
 const lift = Math.min(MAX_REACHABLE_LIFT, Math.max(0, liftTiles));
 crystalSpots.push({
 x,
 y: surfaceY - lift * this.tileSize - 36,
 });
 };
 if (scholarA) pushReachable(scholarA.col * this.tileSize + 60, scholarA.surfaceY, 0);
 if (scholarB) pushReachable(scholarB.col * this.tileSize + 40, scholarB.surfaceY, 1);
 if (scholarC) pushReachable(scholarC.col * this.tileSize + 30, scholarC.surfaceY, 0);
 else {
 const platCol = Math.floor(numCols * 0.54) + 2;
 pushReachable(platCol * this.tileSize, this.surfaceHeights[platCol] * this.tileSize, 2);
 }

 for (let c = 0; c < this.crystalsRequired; c++) {
 const spot = crystalSpots[c] || {
 x: rng.range(900, this.levelWidth - 700),
 y: this.surfaceYAt(rng.range(900, this.levelWidth - 700)) - 40,
 };
 this.crystals.push({ x: spot.x, y: spot.y, w: 24, h: 28, collected: false });
 }

 const endX = this.levelWidth - 380;
 const endSurfaceY = this.surfaceYAt(endX);
 for (let c = bossArenaStart; c < numCols - 2; c++) {
 const sy = this.surfaceHeights[c] * this.tileSize;
 if (c % 3 === 0) {
 this.props.push({ x: c * this.tileSize + 8, y: sy - 72, type: 'pillar', w: 20, h: 64 });
 }
 }

 this.boss = {
 x: endX,
 y: endSurfaceY - 96,
 w: 64,
 h: 64,
 hp: 150,
 maxHp: 150,
 vx: 0,
 vy: 0,
 grounded: false,
 name: BOSS_NAMES[rng.range(0, BOSS_NAMES.length) | 0],
 phase: 0,
 fireTimer: 0,
 };

 const beaconX = endX + 120;
 const beaconNpcX = endX + 170;
 const beaconSurfaceY = this.surfaceYAt(beaconX);
 this.props.push({ x: beaconX, y: beaconSurfaceY - 100, type: 'beacon', w: 40, h: 100 });
 this.npcs.push({
 x: beaconNpcX,
 y: this.surfaceYAt(beaconNpcX) - 48,
 w: 32,
 h: 48,
 text: planetCopy('beaconReady', {}, lang),
 type: 'beacon_npc',
 });

 this.player.x = spawnX;
 this.player.y = spawnSurfaceY - this.player.h;
 this.player.vx = 0;
 this.player.vy = 0;
 this.player.health = 100;
 this.player.ammo = 8;
 this.player.invuln = 0;
 this.player.state = 'idle';
 this.player.grounded = true;

 this.camera.x = this.player.x - (this.game.width / this.zoom / 2);
 this.camera.y = Math.min(this.player.y - (this.game.height / this.zoom / 2), 420);

 this.buildTileIndex();
 this.updateHUD();
 this.isLoading = false;
 } catch (e) {
 console.error('Critical World Gen Error', e);
 this.isLoading = false;
 }
 }

 clearQuizUi() {
 const box = this.ui.dialogueQuiz;
 if (!box) return;
 box.innerHTML = '';
 box.classList.remove('is-open');
 }

 allMartiansTalked() {
 const martians = this.npcs.filter((n) => n.type === 'elder' || n.type === 'scholar');
 return martians.length > 0 && martians.every((n) => n.talked);
 }

 interactWithNpc(nearby) {
 const lang = planetLangCode();
 if (nearby.type === 'beacon_npc') {
 if (!this.bossDefeated) {
 this.showDialogue(npcSpeaker('beacon_npc', lang), planetCopy('nexoBlocked', {}, lang));
 } else if (!this.allMartiansTalked()) {
 this.showDialogue(npcSpeaker('beacon_npc', lang), planetCopy('beaconNeedTalk', {}, lang));
 } else {
 this.completeLevel();
 }
 return;
 }

 if (nearby.type === 'elder') {
 const first = !nearby.talked;
 nearby.talked = true;
 let text;
 if (!nearby.questGiven) {
 nearby.questGiven = true;
 text = `${nearby.text}\n\n${planetCopy('elderQuest', {}, lang)}`;
 } else if (!this.allMartiansTalked()) {
 text = planetCopy('elderNeedTalk', {}, lang);
 } else if (this.crystalsCollected < this.crystalsRequired) {
 text = planetCopy('elderProgress', {
 n: this.crystalsCollected,
 req: this.crystalsRequired,
 }, lang);
 } else if (!this.bossDefeated) {
 text = planetCopy('elderBoss', {}, lang);
 } else {
 text = planetCopy('elderDone', {}, lang);
 }
 this.showDialogue(npcSpeaker('elder', lang), text);
 if (first) this.flashMartianContact();
 else this.updateHUD();
 return;
 }

 if (nearby.type === 'scholar') {
 this.startMartianQuiz(nearby);
 }
 }

 startMartianQuiz(npc) {
 const lang = planetLangCode();
 const quizzes = this.lessonQuizzes || [];
 if (!quizzes.length) {
 npc.talked = true;
 this.grantAmmo(3, npc.x, npc.y);
 this.showDialogue(
 npcSpeaker('scholar', lang),
 `${npc.text}\n\n${planetCopy('scholarNoQuiz', {}, lang)}`
);
 this.updateHUD();
 this.flashMartianContact();
 return;
 }

 const q = quizzes[this.quizCursor % quizzes.length];
 this.quizCursor++;
 this.activeQuiz = { npc, q, lang };
 this.activeDialogue = q.question;
 document.body.classList.add('dialogue-open');
 this.ui.dialogueBox.style.display = 'block';
 this.ui.dialogueSpeaker.innerText = npcSpeaker('scholar', lang);
 this.ui.dialogueText.innerText = `${planetCopy('scholarAsk', {}, lang)}\n\n${q.question}`;
 const box = this.ui.dialogueQuiz;
 if (!box) return;
 box.innerHTML = '';
 box.classList.add('is-open');
 const hint = this.ui.dialogueBox.querySelector('.dialogue-hint');
 if (hint) hint.style.display = 'none';

 q.options.forEach((opt) => {
 const btn = document.createElement('button');
 btn.type = 'button';
 btn.textContent = opt;
 bindMobileTap(btn, () => this.resolveMartianQuiz(opt));
 box.appendChild(btn);
 });
 }

 resolveMartianQuiz(picked) {
 const active = this.activeQuiz;
 if (!active) return;
 const { npc, q, lang } = active;
 const ok = String(picked).trim() === String(q.correct).trim();
 npc.talked = true;
 this.activeQuiz = null;
 this.clearQuizUi();
 const hint = this.ui.dialogueBox.querySelector('.dialogue-hint');
 if (hint) hint.style.display = '';

 try {
 if (q.challenge) window.arborito?.memory?.report?.(q.challenge, ok ? 4 : 1);
 if (ok) window.arborito?.xp?.(8);
 } catch (_) {}

 if (ok) {
 const ammo = 6;
 this.grantAmmo(ammo, npc.x, npc.y);
 this.showDialogue(
 npcSpeaker('scholar', lang),
 planetCopy('scholarGift', {}, lang)
);
 this.flashMartianContact();
 } else {
 this.showDialogue(
 npcSpeaker('scholar', lang),
 `${planetCopy('scholarWrong', {}, lang)}\n(${q.correct})`
);
 this.updateHUD();
 }
 }

 grantAmmo(amount, x, y, { silent = false } = {}) {
 this.player.ammo += amount;
 this.updateHUD();
 this.game.spawnParticle(x, y, '#facc15', 6, 6);
 if (!silent) {
 this.game.showFx?.(planetCopy('fxAmmo', { n: amount }), 'ammo', 1600);
 }
 if (this.ui.ammoDisplay) {
 this.ui.ammoDisplay.classList.remove('pulse');
 void this.ui.ammoDisplay.offsetWidth;
 this.ui.ammoDisplay.classList.add('pulse');
 }
 }

 flashMartianContact() {
 const martians = this.npcs.filter((n) => n.type === 'elder' || n.type === 'scholar');
 const talked = martians.filter((n) => n.talked).length;
 this.game.showFx?.(
 planetCopy('fxMartian', { n: talked, total: martians.length }),
 'quest',
 1600
);
 this.updateHUD();
 }

 /** Pre-bucket tiles by column so collision checks visit O(1) tiles
 * per entity instead of O(N). With ~1200 tiles in a 5000px level,
 * the player + boss + ~20 enemies were doing 25k tile iterations per
 * frame; on planet that translated to noticeable frame drops. */
 buildTileIndex() {
 this.tilesByCol = [];
 for (const t of this.tiles) {
 const col = Math.floor(t.x / this.tileSize);
 if (!this.tilesByCol[col]) this.tilesByCol[col] = [];
 this.tilesByCol[col].push(t);
 }
 }

 /** Yield tiles whose column overlaps the AABB. */
 *nearbyTiles(ent) {
 if (!this.tilesByCol.length) {
 for (const t of this.tiles) yield t;
 return;
 }
 const startCol = Math.floor(ent.x / this.tileSize) - 1;
 const endCol = Math.floor((ent.x + ent.w) / this.tileSize) + 1;
 for (let c = startCol; c <= endCol; c++) {
 const bucket = this.tilesByCol[c];
 if (!bucket) continue;
 for (const t of bucket) yield t;
 }
 }

 update() {
 if (this.isLoading) return;

 if (this.player.health <= 0) return;

 if (this.activeDialogue || this.activeQuiz) {
 if (this.activeQuiz) return;
 if (this.game.input.consume('ArrowUp') || this.game.input.consume(' ') || this.game.input.consume('Enter')
 || this.game.input.consume('e') || this.game.input.consume('E')
 || this.game.input.consume('z') || this.game.input.consume('Z')) {
 this.activeDialogue = null;
 this.ui.dialogueBox.style.display = 'none';
 document.body.classList.remove('dialogue-open');
 }
 return;
 }

 /* After completeLevel(), input/physics freeze until switchMode('space') on the
 next animation frame, keeps state stable for that single frame. */
 if (this.levelComplete) {
 this.player.vx = 0;
 this.player.vy = 0;
 this.player.state = 'idle';
 this.ui.btnInteract.style.display = 'none';
 return;
 }

 this.player.vx = 0;

 const k = this.game.input.keys;
 const pressingLeft = k['ArrowLeft'] || k['a'] || k['A'];
 const pressingRight = k['ArrowRight'] || k['d'] || k['D'];
 const pressingJump = k['ArrowUp'] || k[' '] || k['w'] || k['W'] || k['Spacebar'];

 if (pressingLeft) {
 this.player.vx = -this.moveSpeed;
 this.player.facing = -1;
 this.player.state = 'run';
 } else if (pressingRight) {
 this.player.vx = this.moveSpeed;
 this.player.facing = 1;
 this.player.state = 'run';
 } else {
 this.player.state = 'idle';
 }

 if (pressingJump && this.player.grounded) {
 this.player.vy = this.jumpForce;
 this.player.grounded = false;
 this.game.spawnParticle(this.player.x + 16, this.player.y + 48, '#fff', 3);
 }

 if (this.shipObj && Math.abs(this.player.x - this.shipObj.x) < 80 && Math.abs(this.player.y - this.shipObj.y) < 80) {
 if (this.game.input.consume('z') || this.game.input.consume('Z') || this.game.input.consume('Enter')) {
 if (!this.bossDefeated) {
 this.showDialogue('E.D.E.N.', planetCopy('shipNeedBoss', {}, planetLangCode()));
 } else if (!this.allMartiansTalked()) {
 this.showDialogue('E.D.E.N.', planetCopy('shipNeedTalk', {}, planetLangCode()));
 } else {
 this.completeLevel();
 }
 }
 }

 if (this.player.invuln > 0) this.player.invuln--;

 this.player.vy += this.gravity;

 if(this.player.vy > 18) this.player.vy = 18;

 this.player.x += this.player.vx;
 this.checkCol(true);

 this.player.y += this.player.vy;
 this.player.grounded = false;
 this.checkCol(false);

 if (!this.player.grounded) this.player.state = 'jump';
 this.player.animFrame++;

 if (this.game.input.consume('r') || this.game.input.consume('R') ||
 this.game.input.consume('z') || this.game.input.consume('Z') ||
 this.game.input.consume('j') || this.game.input.consume('J') ||
 this.game.input.consume('f') || this.game.input.consume('F')) this.shoot();

 for (let i = this.projectiles.length - 1; i >= 0; i--) {
 const p = this.projectiles[i];
 p.x += p.vx;
 if (p.vy) p.y += p.vy;
 p.life--;
 if (p.life <= 0) { this.projectiles.splice(i, 1); continue; }

 if (this.boss && !this.bossDefeated && !p.enemy && rectIntersect({x: p.x, y: p.y, w: p.w, h: p.h}, this.boss)) {
 this.boss.hp -= 12;
 this.projectiles.splice(i, 1);
 this.game.spawnParticle(this.boss.x + 32, this.boss.y + 32, '#a78bfa', 8, 10);
 this.game.shake(6);
 if (this.boss.hp <= 0) this.defeatBoss();
 continue;
 }

 if (!p.enemy) for (let j = this.enemies.length - 1; j >= 0; j--) {
 const e = this.enemies[j];
 if (rectIntersect({x: p.x, y: p.y, w: p.w, h: p.h}, e)) {
 this.enemies.splice(j, 1);
 this.projectiles.splice(i, 1);
 this.game.spawnParticle(e.x, e.y, '#ef4444', 6, 8);
 this.game.shake(5);
 break;
 }
 }

 if (p.enemy && rectIntersect({x: p.x, y: p.y, w: p.w, h: p.h}, this.player)) {
 this.damage(5);
 this.projectiles.splice(i, 1);
 }
 }

 this.crystals.forEach(c => {
 if (c.collected) return;
 if (rectIntersect(this.player, { x: c.x - 8, y: c.y - 8, w: c.w + 16, h: c.h + 16 })) {
 c.collected = true;
 this.crystalsCollected++;
 this.game.spawnParticle(c.x, c.y, '#22d3ee', 6, 8);
 this.grantAmmo(5, c.x, c.y, { silent: true });
 this.game.showFx?.(
 planetCopy('fxCrystal', {
 n: this.crystalsCollected,
 req: this.crystalsRequired,
 }),
 'crystal',
 1800
);
 if (this.crystalsCollected >= this.crystalsRequired) {
 this.showDialogue('E.D.E.N.', planetCopy('crystalsFound', { n: this.crystalsRequired }, planetLangCode()));
 }
 this.updateHUD();
 }
 });

 if (this.boss && !this.bossDefeated) {
 this.updateBoss();
 }

 const camLeft = this.camera.x - 120;
 const camRight = this.camera.x + (this.game.width / this.zoom) + 120;
 this.enemies.forEach(e => {
 if (e.x + e.w < camLeft || e.x > camRight) {
 e.vx *= 0.95;
 return;
 }
 const dist = this.player.x - e.x;
 const distY = this.player.y - e.y;
 const range = 320;

 if (Math.abs(dist) < range) {
 e.aggro = true;
 const dir = Math.sign(dist);
 e.vx += dir * 0.2;
 e.vx = Math.max(-4, Math.min(4, e.vx));

 if (e.grounded && (Math.random() < 0.02 || (distY < -50 && Math.random() < 0.05))) {
 e.vy = -12;
 e.grounded = false;
 }
 } else {
 e.vx *= 0.9;
 }

 e.vy += this.gravity;
 e.x += e.vx;
 this.resolveEntityTilesX(e);

 e.y += e.vy;
 e.grounded = false;
 this.resolveEntityTilesY(e);

 if (rectIntersect(e, this.player)) {
 this.damage(4);
 this.player.vx = Math.sign(this.player.x - e.x) * 10;
 this.player.vy = -5;
 e.vx *= -1;
 }
 });

 // Floating logs drift; treat as solid when landing on top.
 this.logs.forEach((log) => {
 log.x += log.vx;
 if (log.x < log.minX || log.x > log.maxX) log.vx *= -1;
 if (rectIntersect(this.player, log) && this.player.vy >= 0) {
 const feet = this.player.y + this.player.h;
 if (feet <= log.y + 10) {
 this.player.y = log.y - this.player.h;
 this.player.vy = 0;
 this.player.grounded = true;
 this.player.x += log.vx;
 }
 }
 });

 // Contaminated lakes / canals, hop logs or take chip damage.
 for (const h of this.hazards) {
 if (!rectIntersect(this.player, h)) continue;
 const onLog = this.logs.some((log) => rectIntersect(this.player, {
 x: log.x - 4, y: log.y - 8, w: log.w + 8, h: log.h + 12,
 }));
 if (!onLog) this.damage(3);
 }

 const targetCamX = this.player.x - (this.game.width / this.zoom / 2);
 const targetCamY = this.player.y - (this.game.height / this.zoom / 2);
 const clampedTargetY = Math.min(targetCamY, 420);

 this.camera.x += (targetCamX - this.camera.x) * 0.1;
 this.camera.y += (clampedTargetY - this.camera.y) * 0.1;

 let nearby = null;
 let isShip = false;

 this.npcs.forEach(n => {
 if (Math.abs(this.player.x - n.x) < 60 && Math.abs(this.player.y - n.y) < 60) nearby = n;
 });

 if (this.shipObj && Math.abs(this.player.x - this.shipObj.x) < 80 && Math.abs(this.player.y - this.shipObj.y) < 80) {
 nearby = { type: 'ship' };
 isShip = true;
 }

 this.ui.btnInteract.style.display = (nearby && !isShip) ? 'flex' : 'none';

 if (nearby && !isShip && nearby.type !== 'beacon_npc') {
 this.setContextPrompt(planetCopy('promptTalk'));
 } else if (isShip && this.bossDefeated && this.allMartiansTalked()) {
 this.setContextPrompt(planetCopy('promptLaunch'), true);
 } else {
 this.setContextPrompt('');
 }

 const wantsInteract = this.game.input.consume('ArrowUp')
 || this.game.input.consume('Enter')
 || this.game.input.consume('e')
 || this.game.input.consume('E')
 || this.game.input.consume('w')
 || this.game.input.consume('W');
 if (nearby && wantsInteract) {
 if (!isShip) {
 this.interactWithNpc(nearby);
 }
 }

 if (this.player.y > 2000) this.damage(100);
 }

 defeatBoss() {
 this.bossDefeated = true;
 this.boss = null;
 this.game.shake(15);
 for (let i = 0; i < 30; i++) {
 this.game.spawnParticle(this.player.x + Math.random() * 100, this.player.y - 50, '#a78bfa', 8, 12);
 }
 this.game.showFx?.(planetCopy('fxBoss'), 'quest', 2200);
 this.showDialogue('E.D.E.N.', planetCopy('bossDefeated', {}, planetLangCode()));
 this.updateHUD();
 if (this.allMartiansTalked()) {
 setTimeout(() => this.game.showFx?.(planetCopy('fxReady'), 'quest', 2000), 900);
 }
 }

 /** Drop heavy planet state as soon as we leave, keeps the rAF loop cheap. */
 teardownLeave() {
 this.activeDialogue = null;
 if (this.ui.dialogueBox) this.ui.dialogueBox.style.display = 'none';
 if (this.ui.btnInteract) this.ui.btnInteract.style.display = 'none';
 this.tiles = [];
 this.tilesByCol = [];
 this.npcs = [];
 this.enemies = [];
 this.projectiles = [];
 this.props = [];
 this.crystals = [];
 this.hazards = [];
 this.logs = [];
 this.activeQuiz = null;
 this.clearQuizUi();
 this.setContextPrompt('');
 document.body.classList.remove('dialogue-open');
 this.boss = null;
 this.shipObj = null;
 this.levelComplete = false;
 this.bossDefeated = false;
 this.isLoading = false;
 }

 completeLevel() {
 if (this.levelComplete) return;
 this.levelComplete = true;

 /* Stop simulating the world the instant the planet is "done". */
 this.enemies = [];
 this.projectiles = [];
 this.boss = null;
 this.bossDefeated = true;
 this.ui.btnInteract.style.display = 'none';

 const planet = this.planet;

 /* Defer the XP grant off the input frame so the parent app's state
 update + ranking publish don't stall the transition frame. */
 if (window.arborito) {
 try {
 setTimeout(() => { try { window.arborito.xp(200); } catch (_) {} }, 0);
 } catch (_) { /* ignore */ }
 }

 /* Return to space immediately, then play victory dialogue there.
 The old 1.5s delay kept drawing the full planet level + backdrop-filter
 HUD while story mode blocked space.update, that locked up the browser. */
 requestAnimationFrame(() => {
 this.game.switchMode('space');
 if (planet) {
 this.game.space.ship.x = planet.x;
 this.game.space.ship.y = planet.y;
 for (let i = 0; i < 12; i++) {
 this.game.spawnParticle(
 this.game.space.ship.x + (Math.random() - 0.5) * 40,
 this.game.space.ship.y + (Math.random() - 0.5) * 40,
 '#22d3ee', 3, 6
);
 }
 }
 this.game.story?.onPlanetComplete(planet);
 });
 }

 updateBoss() {
 const b = this.boss;
 const dist = this.player.x - b.x;
 const distY = this.player.y - b.y;

 if (Math.abs(dist) < 600) {
 const dir = Math.sign(dist);
 b.vx += dir * 0.12;
 b.vx = Math.max(-3.5, Math.min(3.5, b.vx));

 if (b.grounded && (Math.random() < 0.015 || (distY < -60 && Math.random() < 0.04))) {
 b.vy = -14;
 b.grounded = false;
 }

 b.fireTimer--;
 if (b.fireTimer <= 0 && Math.abs(dist) < 400) {
 b.fireTimer = 60;
 const shootDir = Math.sign(dist) || 1;
 this.projectiles.push({
 x: b.x + 32, y: b.y + 20,
 w: 14, h: 8,
 vx: shootDir * 8, vy: -2,
 life: 90, color: '#a78bfa', enemy: true
 });
 }
 } else {
 b.vx *= 0.9;
 }

 b.vy += this.gravity;
 b.x += b.vx;
 this.resolveEntityTilesX(b);
 b.y += b.vy;
 b.grounded = false;
 this.resolveEntityTilesY(b);

 if (rectIntersect(b, this.player)) {
 this.damage(10);
 this.player.vx = Math.sign(this.player.x - b.x) * 12;
 this.player.vy = -8;
 }
 }

 shoot() {
 if (this.player.ammo > 0) {
 this.player.ammo--;
 this.updateHUD();
 this.projectiles.push({
 x: this.player.x + (this.player.facing === 1 ? 32 : -10),
 y: this.player.y + 24,
 w: 12, h: 6,
 vx: this.player.facing * 15,
 life: 60,
 color: '#facc15'
 });
 this.player.vx -= this.player.facing * 3;
 }
 }

 damage(amount) {
 if (this.player.invuln > 0) return;
 this.player.health -= amount;
 this.player.invuln = 40;
 this.updateHUD();
 this.game.shake(12);
 if (this.player.health <= 0) this.ui.deathScreen.classList.remove('hidden');
 }

 updateHUD() {
 if (this.ui.healthFill) {
 this.ui.healthFill.style.width = `${Math.max(0, this.player.health)}%`;
 }
 const martians = this.npcs.filter((n) => n.type === 'elder' || n.type === 'scholar');
 const talked = martians.filter((n) => n.talked).length;
 if (this.ui.ammoDisplay) {
 const lang = planetLangCode();
 this.ui.ammoDisplay.textContent = lang === 'ES'
 ? `Munición ${this.player.ammo} · Cristales ${this.crystalsCollected}/${this.crystalsRequired} · Sabios ${talked}/${martians.length || 0}`
 : `Ammo ${this.player.ammo} · Crystals ${this.crystalsCollected}/${this.crystalsRequired} · Sages ${talked}/${martians.length || 0}`;
 }
 if (this.ui.planetObjective) {
 this.ui.planetObjective.textContent = this.currentObjectiveLine();
 this.ui.planetObjective.classList.toggle(
 'is-done',
 this.bossDefeated && this.allMartiansTalked() && this.crystalsCollected >= this.crystalsRequired
);
 }
 }

 currentObjectiveLine() {
 const martians = this.npcs.filter((n) => n.type === 'elder' || n.type === 'scholar');
 const talked = martians.filter((n) => n.talked).length;
 if (!martians.some((n) => n.type === 'elder' && n.talked)) {
 return planetCopy('objTalkElder');
 }
 if (!this.allMartiansTalked()) {
 return planetCopy('objTalkAll', { n: talked, total: martians.length });
 }
 if (this.crystalsCollected < this.crystalsRequired) {
 return planetCopy('objCrystals', {
 n: this.crystalsCollected,
 req: this.crystalsRequired,
 });
 }
 if (!this.bossDefeated) return planetCopy('objBoss');
 return planetCopy('objLaunch');
 }

 setContextPrompt(text, ship = false) {
 const el = this.ui.contextPrompt;
 if (!el) return;
 if (!text) {
 el.classList.remove('visible', 'is-ship');
 el.textContent = '';
 return;
 }
 el.textContent = text;
 el.classList.toggle('is-ship', !!ship);
 el.classList.add('visible');
 }

 /** Tile collision with spatial bucket lookup, shared by player & enemies. */
 resolveEntityTilesX(ent) {
 for (const t of this.nearbyTiles(ent)) {
 if (rectIntersect(ent, t)) {
 ent.x -= ent.vx;
 ent.vx *= -0.5;
 return;
 }
 }
 }

 resolveEntityTilesY(ent) {
 for (const t of this.nearbyTiles(ent)) {
 if (rectIntersect(ent, t)) {
 if (ent.vy > 0) { ent.y = t.y - ent.h; ent.grounded = true; }
 ent.vy = 0;
 return;
 }
 }
 }

 checkCol(isX) {
 const p = this.player;
 if (isX) {
 for (const t of this.nearbyTiles(p)) {
 if (rectIntersect(p, t)) {
 if (p.vx > 0) p.x = t.x - p.w;
 else if (p.vx < 0) p.x = t.x + t.w;
 p.vx = 0;
 }
 }
 } else {
 for (const t of this.nearbyTiles(p)) {
 if (rectIntersect(p, t)) {
 if (p.vy > 0) {
 p.y = t.y - p.h;
 p.grounded = true;
 } else if (p.vy < 0) {
 p.y = t.y + t.h;
 }
 p.vy = 0;
 }
 }
 }
 }

 showDialogue(speaker, text) {
 this.clearQuizUi();
 this.activeQuiz = null;
 this.activeDialogue = text;
 this.ui.dialogueBox.style.display = 'block';
 this.ui.dialogueSpeaker.innerText = speaker;
 this.ui.dialogueText.innerText = text;
 const hint = this.ui.dialogueBox.querySelector('.dialogue-hint');
 if (hint) hint.style.display = '';
 document.body.classList.add('dialogue-open');
 }

 drawParallax(ctx) {
 const grad = ctx.createLinearGradient(0, 0, 0, this.game.height);
 grad.addColorStop(0, withAlpha(this.theme.sky, 'FF'));
 grad.addColorStop(1, withAlpha(this.theme.bgMount, 'FF'));
 ctx.fillStyle = grad;
 ctx.fillRect(0,0,this.game.width, this.game.height);

 ctx.fillStyle = '#fff';
 for(let i=0; i<30; i++) {
 const px = (i * 91283) % this.game.width;
 const py = (i * 38127) % (this.game.height/2);
 ctx.globalAlpha = 0.5;
 ctx.beginPath(); ctx.arc(px, py, 1, 0, Math.PI*2); ctx.fill();
 }
 ctx.globalAlpha = 1;

 const mountOffset = (this.levelWidth ? this.camera.x / this.levelWidth : 0) * 200 + this.camera.x * 0.08;
 ctx.fillStyle = '#0f172a';
 ctx.beginPath();
 ctx.moveTo(0, this.game.height);
 for(let x=0; x<this.game.width + 50; x+=50) {
 const h = Math.abs(Math.sin((x + mountOffset) * 0.01)) * 100 + 100;
 ctx.lineTo(x, this.game.height - h);
 }
 ctx.lineTo(this.game.width, this.game.height);
 ctx.fill();
 }

 draw(ctx) {
 if (this.isLoading) {
 this.drawParallax(ctx);
 ctx.fillStyle = 'rgba(0,0,0,0.6)';
 ctx.fillRect(0, 0, this.game.width, this.game.height);
 ctx.fillStyle = '#22d3ee';
 ctx.font = 'bold 16px system-ui, sans-serif';
 ctx.textAlign = 'center';
 ctx.fillText('Sincronizando datos del planeta...', this.game.width / 2, this.game.height / 2);
 return;
 }

 this.drawParallax(ctx);

 ctx.save();
 ctx.scale(this.zoom, this.zoom);
 ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

 this.props.forEach(p => {
 if (p.type === 'hut') Sprites.drawHut(ctx, p.x, p.y, p.w, p.h, this.theme.ground);
 if (p.type === 'pillar') {
 ctx.fillStyle = '#64748b';
 ctx.fillRect(p.x, p.y, p.w, p.h);
 ctx.fillStyle = withAlpha(this.theme.ground, 'CC');
 ctx.fillRect(p.x + 2, p.y + 4, p.w - 4, 8);
 }
 if (p.type === 'beacon') {
 ctx.fillStyle = '#94a3b8'; ctx.fillRect(p.x+10, p.y, 20, p.h);
 ctx.fillStyle = '#22c55e'; ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 10;
 ctx.beginPath(); ctx.arc(p.x+20, p.y, 10, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
 }
 });

 // Contaminated pools by biome tint.
 this.hazards.forEach((h) => {
 const tint = this.theme.biomes?.[h.biome]?.hazard
 || (h.type === 'toxic' ? '#9f1239' : h.type === 'canal' ? '#1e3a5f' : '#166534');
 ctx.fillStyle = withAlpha(tint, 'AA');
 ctx.fillRect(h.x, h.y, h.w, h.h);
 ctx.fillStyle = withAlpha(tint, '55');
 ctx.fillRect(h.x, h.y - 4, h.w, 6);
 });
 this.logs.forEach((log) => {
 const wood = this.theme.biomes?.[log.biome]?.log || '#854d0e';
 ctx.fillStyle = wood;
 ctx.fillRect(log.x, log.y, log.w, log.h);
 ctx.fillStyle = 'rgba(255,255,255,0.15)';
 ctx.fillRect(log.x + 2, log.y + 2, log.w - 4, 3);
 });

 const viewLeft = this.camera.x;
 const viewRight = this.camera.x + (this.game.width / this.zoom);
 const colStart = Math.max(0, Math.floor(viewLeft / this.tileSize) - 1);
 const colEnd = Math.min(this.tilesByCol.length - 1, Math.floor(viewRight / this.tileSize) + 1);
 for (let c = colStart; c <= colEnd; c++) {
 const bucket = this.tilesByCol[c];
 if (!bucket) continue;
 for (const t of bucket) {
 if (t.type === 'plat') {
 ctx.fillStyle = withAlpha(this.theme.ground, 'DD');
 ctx.fillRect(t.x, t.y, t.w, t.h);
 ctx.strokeStyle = 'rgba(255,255,255,0.15)';
 ctx.strokeRect(t.x, t.y, t.w, t.h);
 continue;
 }
 const deepShade = t.biome === 'dusk' ? '#0a1018' : t.biome === 'mid' ? '#0f172a' : '#111827';
 const surfaceCol = this.theme.biomes?.[t.biome]?.ground || this.theme.ground;
 ctx.fillStyle = t.type === 'surface' ? surfaceCol : deepShade;
 ctx.fillRect(t.x, t.y, t.w, t.h);
 if (t.type === 'surface') {
 ctx.fillStyle = 'rgba(255,255,255,0.1)';
 ctx.fillRect(t.x, t.y, t.w, 4);
 if (t.deco === 1) {
 ctx.fillStyle = this.theme.ground;
 ctx.beginPath();
 ctx.moveTo(t.x + 10, t.y);
 ctx.lineTo(t.x + 12, t.y - 6);
 ctx.lineTo(t.x + 14, t.y);
 ctx.fill();
 } else if (t.deco === 2) {
 ctx.fillStyle = '#475569';
 ctx.fillRect(t.x + 8, t.y - 8, 12, 8);
 } else if (t.deco === 3) {
 ctx.fillStyle = '#22d3ee';
 ctx.globalAlpha = 0.45;
 ctx.fillRect(t.x + 14, t.y - 4, 4, 4);
 ctx.globalAlpha = 1;
 }
 }
 ctx.strokeStyle = 'rgba(0,0,0,0.2)';
 ctx.strokeRect(t.x, t.y, t.w, t.h);
 }
 }

 if (this.shipObj) {
 Sprites.drawShipLanded(ctx, this.shipObj.x, this.shipObj.y);
 if (Math.abs(this.player.x - this.shipObj.x) < 80) {
 ctx.save();
 ctx.translate(this.shipObj.x + 32, this.shipObj.y - 20);
 const bob = Math.sin(Date.now()*0.005) * 3;
 ctx.translate(0, bob);

 ctx.font = 'bold 8px system-ui, sans-serif';
 ctx.fillStyle = '#facc15'; ctx.textAlign = 'center';
 ctx.shadowColor = '#000'; ctx.shadowBlur = 4;

 ctx.fillStyle = 'rgba(0,0,0,0.8)';
 ctx.fillRect(-40, -10, 80, 12);
 ctx.strokeStyle = '#facc15';
 ctx.strokeRect(-40, -10, 80, 12);

 ctx.fillStyle = '#facc15';
 const canLaunch = this.bossDefeated && this.allMartiansTalked();
 ctx.fillText(canLaunch ? 'DESPEGAR' : 'NAVE', 0, -1);

 ctx.restore();
 }
 }

 this.npcs.forEach(n => {
 if (n.type === 'beacon_npc') return;
 Sprites.drawAlien(ctx, n.x, n.y, n.type === 'elder' ? '#facc15' : '#22c55e', n.h, this.player.animFrame);
 if (Math.abs(this.player.x - n.x) < 80) {
 ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(n.x+16, n.y-10); ctx.lineTo(n.x+24, n.y-20); ctx.lineTo(n.x+8, n.y-20); ctx.fill();
 }
 });

 this.crystals.forEach(c => {
 if (!c.collected) Sprites.drawCrystal(ctx, c.x + 12, c.y + 14, this.player.animFrame, false);
 });

 if (this.boss && !this.bossDefeated) {
 Sprites.drawBossBlob(ctx, this.boss.x, this.boss.y, this.player.animFrame, this.boss.hp / this.boss.maxHp);
 }

 this.enemies.forEach(e => {
 const bounce = Math.abs(Math.sin(this.player.animFrame * 0.4)) * 5;
 Sprites.drawBlob(ctx, e.x, e.y - bounce, '#ef4444');
 });

 ctx.fillStyle = '#facc15';
 this.projectiles.forEach(p => {
 ctx.fillRect(p.x, p.y, p.w, p.h);
 ctx.shadowColor = '#facc15'; ctx.shadowBlur = 10;
 });
 ctx.shadowBlur = 0;

 Sprites.drawAstronaut(ctx, this.player.x, this.player.y, this.player.facing, this.player.state, this.player.animFrame);
 if (this.player.invuln > 0 && (this.player.invuln % 6) < 3) {
 ctx.fillStyle = 'rgba(255,255,255,0.35)';
 ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
 }

 ctx.restore();

 const grad = ctx.createLinearGradient(0, 0, 0, this.game.height);
 grad.addColorStop(0, withAlpha(this.theme.ground, '33'));
 grad.addColorStop(1, 'transparent');
 ctx.fillStyle = grad;
 ctx.globalCompositeOperation = 'overlay';
 ctx.fillRect(0,0,this.game.width, this.game.height);
 ctx.globalCompositeOperation = 'source-over';
 }
}
