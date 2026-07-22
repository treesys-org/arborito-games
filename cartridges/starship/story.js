import { bindMobileTap } from './utils.js';

export const STORY = {
 companion: 'E.D.E.N.',
 antagonist: 'El Coro del Vacío',

 chapters: [
 {
 id: 0,
 title: 'Despertar en el Abismo',
 sector: 'A',
 intro: [
 { speaker: 'E.D.E.N.', text: 'Capitán… sistemas online. Soy E.D.E.N., tu compañera a bordo.' },
 { speaker: 'E.D.E.N.', text: 'El Coro del Vacío ha silenciado los Archivos Galácticos. Sus Ecos guardan el saber robado en cada planeta.' },
 { speaker: 'E.D.E.N.', text: 'Aterriza cerca de un planeta del radar. En superficie, busca a los Sabios Marcianos: ellos te dirán qué falta.' }
 ],
 complete: [
 { speaker: 'E.D.E.N.', text: 'Sector Alfa estabilizado. El Coro pierde fuerza… sigue al siguiente sistema.' }
 ]
 },
 {
 id: 1,
 title: 'Ecos de la Ignorancia',
 sector: 'B',
 intro: [
 { speaker: 'E.D.E.N.', text: 'Sector Beta. Skiffs del Vacío en órbita, mantén escudos activos.' },
 { speaker: 'E.D.E.N.', text: 'Aquí los Ecos son más agresivos. Sin munición, las Sombras te atraparán en superficie.' }
 ],
 complete: [
 { speaker: 'E.D.E.N.', text: 'Beta asegurado. Sensores apuntan al Nexo Central.' }
 ]
 },
 {
 id: 2,
 title: 'El Nexo del Conocimiento',
 sector: 'C',
 intro: [
 { speaker: 'E.D.E.N.', text: 'Sector Gamma, el corazón del Coro. Cada fragmento que recuperes restaura un pilar del Archivo.' },
 { speaker: '???', text: '…el saber… es… dolor…' }
 ],
 complete: [
 { speaker: 'E.D.E.N.', text: '¡El Nexo se estabiliza! El Coro del Vacío calla… por ahora. Odisea cumplida.' }
 ]
 }
 ],

 planetLanding: (title) => [
 { speaker: 'E.D.E.N.', text: `Descenso en "${title}". Busca al Anciano Marciano cerca de tu nave.` },
 { speaker: 'E.D.E.N.', text: 'Los Ecos del Vacío son sombras que custodian el saber. Los cristales azules lo liberan, y el Eco mayor espera al este.' }
 ],

 planetComplete: (title) => [
 { speaker: 'E.D.E.N.', text: `Fragmento de "${title}" integrado. +200 XP. Regresa al espacio: el radar marcará el siguiente mundo.` }
 ],

 loreFragments: [
 'Los Sabios Marcianos guardaron el saber en cristales resonantes.',
 'El Coro del Vacío nació de civilizaciones que olvidaron aprender.',
 'Cada planeta es una lección. Cada lección, un arma contra la ignorancia.',
 'La nave ISS Arborito fue construida con árboles de conocimiento cristalizados.',
 'Las Sombras se alimentan de preguntas sin respuesta.',
 'E.D.E.N. fue creada por la última bibliotecaria de Marte.',
 'Los Skiffs del Vacío patrullan rutas comerciales de ideas.',
 'El Nexo Central conecta todas las galaxias de aprendizaje.',
 'Recuperar un fragmento restaura una estrella en el mapa estelar.',
 'Los Ancianos llevan milenios esperando a un piloto como tú.',
 'La ignorancia no es vacío: es ruido que ahoga la señal.',
 'Al completar la odisea, el universo recuerda cómo pensar.'
 ]
};

export class StoryEngine {
 constructor(game) {
 this.game = game;
 this.collected = new Set();
 this.completedSectors = new Set();
 this.currentChapter = 0;
 this.loreUnlocked = 0;
 this.dialogueQueue = [];
 this.activeLine = null;
 this.isShowing = false;

 this.ui = {
 box: document.getElementById('story-dialogue'),
 speaker: document.getElementById('story-speaker'),
 text: document.getElementById('story-text'),
 hint: document.getElementById('story-hint'),
 questLog: document.getElementById('quest-log'),
 questTitle: document.getElementById('quest-title'),
 questDesc: document.getElementById('quest-desc'),
 fragmentCount: document.getElementById('fragment-count'),
 chapterTitle: document.getElementById('chapter-title')
 };

 bindMobileTap(this.ui.box, () => this.advance());
 document.addEventListener('keydown', (e) => {
 if (this.isShowing && (e.key === 'Enter' || e.key === ' ')) {
 e.preventDefault();
 this.advance();
 }
 });
 }

 totalPlanets() {
 let n = 0;
 this.game.space.systems.forEach(s => n += s.planets.length);
 return n;
 }

 collectedCount() {
 return this.collected.size;
 }

 isPlanetDone(planet) {
 return this.collected.has(planet.data.id ?? planet.data.title);
 }

 markPlanetComplete(planet) {
 const key = planet.data.id ?? planet.data.title;
 if (this.collected.has(key)) return false;
 this.collected.add(key);
 this.loreUnlocked = Math.min(this.loreUnlocked + 1, STORY.loreFragments.length);
 this.checkSectorComplete();
 this.updateQuestUI();
 return true;
 }

 checkSectorComplete() {
 this.game.space.systems.forEach((sys, idx) => {
 const allDone = sys.planets.every(p => this.isPlanetDone(p));
 if (allDone && sys.planets.length > 0) {
 this.completedSectors.add(idx);
 if (idx >= this.currentChapter) {
 this.queue(STORY.chapters[idx]?.complete || []);
 this.currentChapter = Math.min(idx + 1, STORY.chapters.length - 1);
 }
 }
 });
 }

 getCurrentChapter() {
 return STORY.chapters[Math.min(this.currentChapter, STORY.chapters.length - 1)];
 }

 queue(lines) {
 this.dialogueQueue.push(...lines);
 if (!this.isShowing) this.showNext();
 }

 showNext() {
 if (this.dialogueQueue.length === 0) {
 this.hide();
 return;
 }
 if (!this.isShowing) this._returnMode = this.game.mode;
 this.activeLine = this.dialogueQueue.shift();
 this.isShowing = true;
 if (this.ui.box) {
 this.ui.box.classList.remove('hidden');
 this.ui.speaker.textContent = this.activeLine.speaker;
 this.ui.text.textContent = '';
 this.typewrite(this.activeLine.text);
 }
 this.game.mode = 'story';
 document.body.classList.add('story-open');
 }

 typewrite(text) {
 if (!this.ui.text) return;
 let i = 0;
 clearInterval(this._tw);
 this._tw = setInterval(() => {
 this.ui.text.textContent = text.slice(0, ++i);
 if (i >= text.length) clearInterval(this._tw);
 }, 18);
 }

 advance() {
 if (this.ui.text && this.activeLine && this.ui.text.textContent.length < this.activeLine.text.length) {
 clearInterval(this._tw);
 this.ui.text.textContent = this.activeLine.text;
 return;
 }
 this.showNext();
 }

 hide() {
 this.isShowing = false;
 this.activeLine = null;
 this.ui.box?.classList.add('hidden');
 document.body.classList.remove('story-open');
 if (this.game.mode === 'story') {
 this.game.mode = this._returnMode || 'space';
 }
 }

 onGameStart() {
 this.queue(STORY.chapters[0].intro);
 this.updateQuestUI();
 }

 onEnterSector(sectorIndex) {
 const ch = STORY.chapters[sectorIndex];
 if (ch && !this.completedSectors.has(sectorIndex) && sectorIndex <= this.currentChapter) {
 this.queue(ch.intro.slice(0, sectorIndex === 0 ? 99 : 2));
 }
 this.updateQuestUI();
 }

 onPlanetLanding(planet) {
 this.queue(STORY.planetLanding(planet.data.title));
 }

 onPlanetComplete(planet) {
 if (this.markPlanetComplete(planet)) {
 this.queue(STORY.planetComplete(planet.data.title));
 }
 }

 updateQuestUI() {
 const ch = this.getCurrentChapter();
 if (this.ui.questTitle) this.ui.questTitle.textContent = ch?.title || 'Odisea';
 if (this.ui.questDesc) {
 const pending = this.totalPlanets() - this.collectedCount();
 const sector = this.game.space.systems[this.game.space.activeSector];
 const sectorPlanets = sector?.planets || [];
 const sectorPending = sectorPlanets.filter(p => !this.isPlanetDone(p)).length;
 if (pending > 0) {
 this.ui.questDesc.textContent = sectorPending > 0
 ? `Radar: ${sectorPending} planeta(s) con fragmentos. Acércate y aterriza.`
 : `Quedan ${pending} fragmento(s) en otros sectores.`;
 } else {
 this.ui.questDesc.textContent = 'Odisea completa. Explora libremente.';
 }
 }
 if (this.ui.fragmentCount) {
 this.ui.fragmentCount.textContent = `${this.collectedCount()}/${this.totalPlanets()}`;
 }
 if (this.ui.chapterTitle) {
 this.ui.chapterTitle.textContent = `Cap. ${this.currentChapter + 1}`;
 }
 }

 getLoreSnippet() {
 return STORY.loreFragments[this.loreUnlocked - 1] || STORY.loreFragments[0];
 }
}
