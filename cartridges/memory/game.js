import { FX } from './fx.js';
/* Mobile-safe tap from the SDK (window.arborito.platform.onTap).
 * Aliased so the rest of the cartridge keeps its existing name. */
const bindMobileTap = (window.arborito && window.arborito.platform && window.arborito.platform.onTap) || (() => () => {});

const SAVE_KEY = 'garden_progress_v1';
const MODE_KEY = 'garden_mode_v1';
/** Fixed grid size; unfilled slots render as inactive placeholders. */
const MAX_PAIR_SLOTS = 6;
const MODE_CARDS = 'cards';
const MODE_REVIEW = 'review';

/* Review-mode buttons send a quality score in the 0..5 range to
 * arborito.memory.report. Quality 0 resets the interval (next review the
 * same day); 3-5 push it forward at increasing speeds. The data-q attribute
 * on each rating button mirrors these numbers. */

const translations = {
    EN: {
        SCORE: 'Score',
        LEVEL: 'Level',
        LESSON_PROGRESS: 'Lesson {current}/{total}',
        INITIALIZE: 'INITIALIZE',
        LOADING_SAGE: 'Consulting the Sage...',
        VICTORY_TITLE: 'GARDEN BLOOMED',
        VICTORY_REVIEW: 'MEMORY WATERED 💧',
        FINAL_SCORE: 'Final Score: ',
        HIGH_SCORE: 'High Score: ',
        CONTINUE: 'NEXT LESSON',
        RETRY: 'RETRY LESSON',
        RESTART: 'RESTART',
        LEVEL_UP: 'Level {n}!',
        ROTATE_TITLE: 'Portrait Mode<br>Recommended',
        ROTATE_DESC: 'Let the garden grow tall.',
        LOADING_CRYSTALS: 'Synthesizing crystals…',
        SYNTHESIS_FAILED: "Couldn't generate this lesson's pairs. Try another lesson or switch modes in settings.",
        INIT_FAILED: "Couldn't start the garden. Try another lesson or reopen the game.",
        NO_BRIDGE: "Couldn't connect to the course. Go back to the menu and try again.",
        NO_LESSON: 'No lessons are available yet. Add some from the course menu.',
        MODE_REVIEW: 'WATERING MODE',
        FEW_PAIRS: 'Some tiles stay fallow — only {n} pair(s) available in the curriculum.',
        WINS: 'Gardens grown: {n}',
        MODE_CARDS: '🃏 PAIRS',
        MODE_REVIEW_BTN: '🧠 REVIEW',
        MODE_CARDS_DESC: 'Match terms with their definitions in a fast pair grid.',
        MODE_REVIEW_DESC: 'Spaced repetition: tap the card to flip, then say if you recalled it.',
        REVIEW_PROGRESS_DUE: 'Branch {current} of {total} · due',
        REVIEW_PROGRESS_FRESH: 'Branch {current} of {total} · fresh practice',
        REVIEW_NO_QUIZ_TITLE: 'No quizzes yet',
        REVIEW_NO_QUIZ_BODY: 'This branch has no questionnaire built. Open Construction → Quiz V2 and add at least one to play it in REVIEW.',
        REVIEW_SKIP: 'Skip branch',
        REVIEW_TAP_TO_FLIP: 'Tap to reveal',
        REVIEW_BACK_EYEBROW: 'Answer',
        REVIEW_PROMPT_DEFINE: 'What is "{concept}"?',
        REVIEW_PROMPT_STEPS: 'What are the steps for "{concept}"?',
        REVIEW_PROMPT_CLOZE: 'Fill in the blank:',
        RATE_AGAIN: 'Review again',
        RATE_GOOD: 'Got it',
        REVIEW_DONE_TITLE: 'Session complete!',
        REVIEW_DONE_BODY: 'No more branches to review right now. Come back tomorrow or switch to PAIRS mode.',
        REVIEW_NO_CARDS: 'There are no lessons in this course yet. Add some content first.',
        REVIEW_VICTORY_TITLE: 'SESSION COMPLETE'
    },
    ES: {
        SCORE: 'Puntos',
        LEVEL: 'Nivel',
        LESSON_PROGRESS: 'Lección {current}/{total}',
        INITIALIZE: 'INICIALIZAR',
        LOADING_SAGE: 'Consultando al Sabio...',
        VICTORY_TITLE: 'JARDÍN FLORECIDO',
        VICTORY_REVIEW: 'MEMORIA REGADA 💧',
        FINAL_SCORE: 'Puntuación Final: ',
        HIGH_SCORE: 'Puntuación Máxima: ',
        CONTINUE: 'SIGUIENTE LECCIÓN',
        RETRY: 'REPETIR LECCIÓN',
        RESTART: 'REINICIAR',
        LEVEL_UP: '¡Nivel {n}!',
        ROTATE_TITLE: 'Modo Vertical<br>Recomendado',
        ROTATE_DESC: 'Deja que el jardín crezca alto.',
        LOADING_CRYSTALS: 'Sintetizando cristales…',
        SYNTHESIS_FAILED: 'No se pudieron generar pares para esta lección. Prueba otra o cambia de modo en ajustes.',
        INIT_FAILED: 'No se pudo iniciar el jardín. Prueba con otra lección o vuelve a abrir el juego.',
        NO_BRIDGE: 'No se pudo conectar con el curso. Vuelve al menú e inténtalo otra vez.',
        NO_LESSON: 'Todavía no hay lecciones disponibles. Añade algunas desde el menú del curso.',
        MODE_REVIEW: 'MODO RIEGO',
        FEW_PAIRS: 'Algunas casillas quedan vacías — solo hay {n} par(es) en el currículo.',
        WINS: 'Jardines cultivados: {n}',
        MODE_CARDS: '🃏 PARES',
        MODE_REVIEW_BTN: '🧠 REPASO',
        MODE_CARDS_DESC: 'Empareja términos con sus definiciones en una rejilla rápida.',
        MODE_REVIEW_DESC: 'Repetición espaciada: toca la tarjeta para girarla y dí si la recordabas.',
        REVIEW_PROGRESS_DUE: 'Rama {current} de {total} · pendiente',
        REVIEW_PROGRESS_FRESH: 'Rama {current} de {total} · práctica nueva',
        REVIEW_NO_QUIZ_TITLE: 'Sin cuestionarios',
        REVIEW_NO_QUIZ_BODY: 'Esta rama no tiene cuestionario. Ábrela en Construcción → Quiz V2 y añade al menos uno para jugarla en REPASO.',
        REVIEW_SKIP: 'Saltar rama',
        REVIEW_TAP_TO_FLIP: 'Toca para girar',
        REVIEW_BACK_EYEBROW: 'Respuesta',
        REVIEW_PROMPT_DEFINE: '¿Qué es "{concept}"?',
        REVIEW_PROMPT_STEPS: '¿Cuáles son los pasos de "{concept}"?',
        REVIEW_PROMPT_CLOZE: 'Completa el espacio:',
        RATE_AGAIN: 'Repasar',
        RATE_GOOD: 'Bien',
        REVIEW_DONE_TITLE: '¡Sesión completa!',
        REVIEW_DONE_BODY: 'No quedan ramas pendientes. Vuelve mañana o cambia al modo PARES.',
        REVIEW_NO_CARDS: 'Este curso aún no tiene lecciones. Añade contenido primero.',
        REVIEW_VICTORY_TITLE: 'SESIÓN COMPLETA'
    }
};

const lang =
    window.arborito &&
    window.arborito.user &&
    translations[window.arborito.user.lang.toUpperCase()]
        ? window.arborito.user.lang.toUpperCase()
        : 'EN';
const i18n = (key, vars = {}) => {
    let s = translations[lang][key] || translations.EN[key] || key;
    Object.keys(vars).forEach((k) => {
        s = s.replace(`{${k}}`, String(vars[k]));
    });
    return s;
};

/** Minimal HTML escape for the small DOM templates this cartridge injects
 *  via innerHTML (review-mode flashcard, empty-state). */
function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function loadProgress() {
    try {
        if (window.arborito?.load) {
            const s = window.arborito.load(SAVE_KEY);
            if (s && typeof s === 'object') {
                return {
                    level: Math.max(1, Number(s.level) || 1),
                    wins: Math.max(0, Number(s.wins) || 0)
                };
            }
        }
    } catch (_) {}
    return { level: 1, wins: 0 };
}

function saveProgress(progress) {
    try {
        if (window.arborito?.save) {
            window.arborito.save(SAVE_KEY, progress);
        }
    } catch (_) {}
}

function loadPreferredMode() {
    try {
        if (window.arborito?.load) {
            const m = window.arborito.load(MODE_KEY);
            if (m === MODE_REVIEW || m === MODE_CARDS) return m;
        }
    } catch (_) {}
    return MODE_CARDS;
}

function savePreferredMode(mode) {
    try {
        if (window.arborito?.save) {
            window.arborito.save(MODE_KEY, mode);
        }
    } catch (_) {}
}

function pairsForLevel(level) {
    /* Grid layout is fixed at MAX_PAIR_SLOTS; extra levels only raise scoring, not pair count. */
    return Math.min(MAX_PAIR_SLOTS, Math.max(3, 3 + Math.floor((level - 1) / 2)));
}

function comboMultiplier(level) {
    return 1 + Math.min(0.5, (level - 1) * 0.05);
}

class MemoryGame {
    constructor() {
        this.lang = lang;
        this.progress = loadProgress();
        this.lastLesson = null;
        this.lessonIndex = 0;
        this.curriculumSize = 0;
        this.pendingLevelUp = false;
        this.mode = loadPreferredMode();

        /* Review-mode runtime. The queue is built once per session from the
         * SRS scheduler (`arborito.memory.due()`) and topped up with fresh
         * lessons so a learner with no history still has cards to drill.
         * `phase` walks the user through: 'front' (question hidden) →
         * 'back' (answer shown, ratings unlocked) → next card. */
        this.review = {
            queue: [],
            dueCount: 0,
            index: 0,
            phase: 'front',
            currentLesson: null,
            currentCard: null
        };

        this.state = {
            cards: [],
            flipped: [],
            matchedCount: 0,
            locked: false,
            score: 0,
            highScore: 0,
            combo: 0,
            comboTimer: 0,
            currentLessonId: null,
            isReviewMode: false,
            realPairCount: 0,
            totalPlayableCards: 0,
            pairTarget: pairsForLevel(this.progress.level)
        };

        this.els = {
            grid: document.getElementById('card-grid'),
            cardsView: document.getElementById('cards-view'),
            reviewView: document.getElementById('review-view'),
            reviewProgress: document.getElementById('review-progress'),
            reviewCardHost: document.getElementById('review-card-host'),
            reviewActions: document.getElementById('review-actions'),
            rateAgainLabel: document.getElementById('rate-again-label'),
            rateGoodLabel: document.getElementById('rate-good-label'),
            scoreLabel: document.getElementById('score-label'),
            score: document.getElementById('score-display'),
            levelLabel: document.getElementById('level-label'),
            levelDisplay: document.getElementById('level-display'),
            lessonProgress: document.getElementById('lesson-progress'),
            comboBar: document.getElementById('combo-bar'),
            startScreen: document.getElementById('start-screen'),
            victoryScreen: document.getElementById('victory-screen'),
            victoryTitle: document.getElementById('victory-title'),
            levelUpBanner: document.getElementById('level-up-banner'),
            finalScoreLabel: document.getElementById('final-score-label'),
            finalScore: document.getElementById('final-score'),
            highScoreLabel: document.getElementById('high-score-label'),
            highScore: document.getElementById('high-score'),
            winsLine: document.getElementById('wins-line'),
            btnStart: document.getElementById('btn-start'),
            btnContinue: document.getElementById('btn-continue'),
            btnRetry: document.getElementById('btn-retry'),
            btnRestart: document.getElementById('btn-restart'),
            loadState: document.getElementById('loading-state'),
            loadText: document.getElementById('loading-text'),
            topic: document.getElementById('lesson-topic'),
            rotateTitle: document.getElementById('rotate-title'),
            rotateDesc: document.getElementById('rotate-desc'),
            roundLoader: document.getElementById('round-loader'),
            roundLoaderText: document.querySelector('#round-loader p'),
            modeCardsBtn: document.getElementById('mode-cards'),
            modeReviewBtn: document.getElementById('mode-review'),
            modeDesc: document.getElementById('mode-desc')
        };

        this.els.scoreLabel.textContent = i18n('SCORE');
        this.els.levelLabel.textContent = i18n('LEVEL');
        this.els.btnStart.querySelector('span').textContent = i18n('INITIALIZE');
        this.els.loadText.textContent = i18n('LOADING_SAGE');
        this.els.victoryTitle.textContent = i18n('VICTORY_TITLE');
        this.els.finalScoreLabel.textContent = i18n('FINAL_SCORE');
        this.els.highScoreLabel.textContent = i18n('HIGH_SCORE');
        this.els.btnContinue.textContent = i18n('CONTINUE');
        this.els.btnRetry.textContent = i18n('RETRY');
        this.els.btnRestart.textContent = i18n('RESTART');
        this.els.rotateTitle.innerHTML = i18n('ROTATE_TITLE');
        this.els.rotateDesc.textContent = i18n('ROTATE_DESC');
        if (this.els.roundLoaderText) {
            this.els.roundLoaderText.textContent = i18n('LOADING_CRYSTALS');
        }
        this._applyModeI18n();
        this._reflectModePicker();

        if (window.arborito) {
            this.state.highScore = window.arborito.load('high_score') || 0;
        }

        this.updateProgressHud();
        this.fx = new FX();
        this.initListeners();
        this.gameLoop();
    }

    initListeners() {
        this.els.btnStart.addEventListener('click', () => this.startSequence());
        this.els.btnContinue.addEventListener('click', () => this.continueToNextRound());
        this.els.btnRetry.addEventListener('click', () => this.retrySameLesson());
        this.els.btnRestart.addEventListener('click', () => this.restartSession());

        const pickMode = (m) => {
            if (m !== MODE_CARDS && m !== MODE_REVIEW) return;
            if (this.mode === m) return;
            this.mode = m;
            savePreferredMode(m);
            this._reflectModePicker();
        };
        if (this.els.modeCardsBtn) {
            this.els.modeCardsBtn.addEventListener('click', () => pickMode(MODE_CARDS));
        }
        if (this.els.modeReviewBtn) {
            this.els.modeReviewBtn.addEventListener('click', () => pickMode(MODE_REVIEW));
        }

        if (this.els.reviewCardHost) {
            this.els.reviewCardHost.addEventListener('click', (e) => {
                const flip = e.target.closest('.flip-card');
                if (flip) { this._flipReviewCard(); return; }
                const skip = e.target.closest('.review-skip-btn');
                if (skip) { this._skipReviewCard(); }
            });
        }
        if (this.els.reviewActions) {
            this.els.reviewActions.addEventListener('click', (e) => {
                const btn = e.target.closest('.rate-btn');
                if (!btn) return;
                const q = Number(btn.dataset.q);
                if (Number.isFinite(q)) this._gradeReviewCard(q);
            });
        }
    }

    /** Localise the mode picker labels and rating buttons. */
    _applyModeI18n() {
        if (this.els.modeCardsBtn) this.els.modeCardsBtn.textContent = i18n('MODE_CARDS');
        if (this.els.modeReviewBtn) this.els.modeReviewBtn.textContent = i18n('MODE_REVIEW_BTN');
        if (this.els.rateAgainLabel) this.els.rateAgainLabel.textContent = i18n('RATE_AGAIN');
        if (this.els.rateGoodLabel) this.els.rateGoodLabel.textContent = i18n('RATE_GOOD');
    }

    /** Apply the active mode to picker pressed-state and helper text. */
    _reflectModePicker() {
        const isReview = this.mode === MODE_REVIEW;
        if (this.els.modeCardsBtn) {
            this.els.modeCardsBtn.setAttribute('aria-pressed', isReview ? 'false' : 'true');
        }
        if (this.els.modeReviewBtn) {
            this.els.modeReviewBtn.setAttribute('aria-pressed', isReview ? 'true' : 'false');
        }
        if (this.els.modeDesc) {
            this.els.modeDesc.textContent = i18n(isReview ? 'MODE_REVIEW_DESC' : 'MODE_CARDS_DESC');
        }
    }

    updateProgressHud() {
        this.els.levelDisplay.textContent = String(this.progress.level);
        if (this.curriculumSize > 0) {
            this.els.lessonProgress.textContent = i18n('LESSON_PROGRESS', {
                current: this.lessonIndex + 1,
                total: this.curriculumSize
            });
            this.els.lessonProgress.classList.remove('opacity-0');
        }
    }

    gameLoop() {
        if (this.state.combo > 0) {
            this.state.comboTimer -= 0.5;
            if (this.state.comboTimer <= 0) {
                this.state.combo = 0;
                this.state.comboTimer = 0;
            }
        }

        const percent = Math.min(100, (this.state.comboTimer / 100) * 100);
        this.els.comboBar.style.width = `${percent}%`;

        requestAnimationFrame(() => this.gameLoop());
    }

    resetRoundState() {
        this.state.cards = [];
        this.state.flipped = [];
        this.state.matchedCount = 0;
        this.state.locked = false;
        this.state.score = 0;
        this.state.combo = 0;
        this.state.comboTimer = 0;
        this.state.realPairCount = 0;
        this.state.totalPlayableCards = 0;
        this.state.pairTarget = pairsForLevel(this.progress.level);
        this.els.score.innerText = '0';
        this.els.grid.innerHTML = '';
    }

    async startSequence() {
        this.els.btnStart.classList.add('hidden');
        this.els.loadState.classList.remove('hidden');

        await this.fx.initAudio();

        try {
            if (this.mode === MODE_REVIEW) {
                await this._startReviewSession();
            } else {
                await this.loadRound({ advanceLesson: true });
            }
        } catch (e) {
            this.handleError(e.message || i18n('INIT_FAILED'));
        }
    }

    async continueToNextRound() {
        this.els.victoryScreen.classList.add('hidden-fade');
        this.els.roundLoader.classList.remove('hidden');
        this.resetRoundState();

        try {
            if (this.mode === MODE_REVIEW) {
                this.els.roundLoader.classList.add('hidden');
                await this._startReviewSession();
            } else {
                await this.loadRound({ advanceLesson: true });
            }
        } catch (e) {
            this.els.roundLoader.classList.add('hidden');
            this.handleError(e.message || i18n('INIT_FAILED'));
            this.els.victoryScreen.classList.remove('hidden-fade');
        }
    }

    async retrySameLesson() {
        if (this.mode === MODE_REVIEW) {
            return this.continueToNextRound();
        }
        if (!this.lastLesson) {
            return this.continueToNextRound();
        }
        this.els.victoryScreen.classList.add('hidden-fade');
        this.els.roundLoader.classList.remove('hidden');
        this.resetRoundState();

        try {
            await this.loadRound({ advanceLesson: false, lessonOverride: this.lastLesson });
        } catch (e) {
            this.els.roundLoader.classList.add('hidden');
            this.handleError(e.message || i18n('INIT_FAILED'));
            this.els.victoryScreen.classList.remove('hidden-fade');
        }
    }

    /* ---------------------------------------------------------------------
     * Review (spaced-repetition flashcards) mode
     * ------------------------------------------------------------------ */

    _showCardsView() {
        if (this.els.cardsView) this.els.cardsView.style.display = '';
        if (this.els.reviewView) this.els.reviewView.classList.remove('active');
    }

    _showReviewView() {
        if (this.els.cardsView) this.els.cardsView.style.display = 'none';
        if (this.els.reviewView) this.els.reviewView.classList.add('active');
    }

    /** Build the queue of lessons for this session: due cards first, then a
     *  capped slice of the curriculum so the user always has something to
     *  practice even when nothing is due. The queue stores curriculum
     *  *indices* (not full lessons) so we can lazy-fetch the body from the
     *  host via `arborito.lesson.at(idx)` when each card is shown. */
    async _startReviewSession() {
        if (!window.arborito?.lesson) {
            throw new Error(i18n('NO_BRIDGE'));
        }

        const curriculum = window.arborito.lesson.list() || [];
        this.curriculumSize = curriculum.length;
        if (!curriculum.length) {
            throw new Error(i18n('REVIEW_NO_CARDS'));
        }

        const dueIds = (window.arborito.memory?.due?.() || []).map(String);
        const dueSet = new Set(dueIds);
        const dueIndices = [];
        const freshIndices = [];

        curriculum.forEach((l, idx) => {
            if (!l || !l.id) return;
            if (dueSet.has(String(l.id))) dueIndices.push(idx);
            else freshIndices.push(idx);
        });

        /* Cap the fresh top-up so huge courses don't produce 200-card
         * sessions when the user has zero SRS history. */
        const FRESH_CAP = 12;
        const queue = dueIndices.concat(freshIndices.slice(0, FRESH_CAP));

        this.review.queue = queue;
        this.review.dueCount = dueIndices.length;
        this.review.index = 0;
        this.review.currentLesson = null;

        this.els.loadState.classList.add('hidden');
        this._showReviewView();
        document.getElementById('game-ui').classList.remove('hidden');
        this.els.startScreen.classList.add('hidden-fade');

        await this._renderNextReviewCard();
    }

    async _renderNextReviewCard() {
        if (!this.review.queue.length || this.review.index >= this.review.queue.length) {
            return this._showReviewVictory();
        }

        const lessonIdx = this.review.queue[this.review.index];
        let lesson = null;
        try {
            lesson = await window.arborito.lesson.at(lessonIdx);
        } catch (_) {
            lesson = null;
        }
        if (!lesson) {
            this.review.index += 1;
            return this._renderNextReviewCard();
        }

        const flashcard = this._pickFlashcardFromLesson(lesson);
        this.review.currentLesson = lesson;
        this.review.currentCard = flashcard;
        this.review.phase = 'front';

        this._updateReviewProgress();
        this._toggleRateActions(false);
        if (!flashcard) this._renderEmptyReviewCard(lesson);
        else this._renderFlipCard(flashcard, lesson);
    }

    _updateReviewProgress() {
        if (!this.els.reviewProgress) return;
        const isDue = this.review.index < this.review.dueCount;
        this.els.reviewProgress.textContent = i18n(
            isDue ? 'REVIEW_PROGRESS_DUE' : 'REVIEW_PROGRESS_FRESH',
            { current: this.review.index + 1, total: this.review.queue.length }
        );
    }

    _toggleRateActions(visible) {
        const row = this.els.reviewActions;
        if (!row) return;
        row.classList.toggle('is-hidden', !visible);
        row.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }

    /** Build a {prompt, answer, concept} flashcard out of the lesson's
     *  Quiz V2 challenges.
     *
     *  Pedagogical priority — best to worst — when picking which face to
     *  show on the front:
     *    1) Authored Q&A (`main_question` + `correct_answer`).
     *    2) Concept + Definition pair (rephrased as "What is X?").
     *    3) Cloze (fill-in-the-blank) when there's a definition + index;
     *       the blanked word rotates per pass so the same card stresses
     *       different vocabulary on repeat exposures.
     *    4) Steps lists, asked as "What are the steps for X?".
     *    5) Concept + answer fallback (rephrased as a question).
     *
     *  We also rotate which challenge is picked from the lesson per pass
     *  so a 3-challenge branch shows different angles across reviews
     *  rather than the same one every time.
     */
    _pickFlashcardFromLesson(lesson) {
        let challenges = [];
        try {
            challenges = window.arborito?.challenge?.fromLesson?.(lesson) || [];
        } catch (_) {
            challenges = [];
        }
        const usable = (challenges || []).filter((c) => this._challengeHasFace(c));
        if (!usable.length) return null;
        const ch = usable[this.review.index % usable.length];
        return this._challengeToFlashcard(ch, this.review.index);
    }

    _challengeHasFace(c) {
        if (!c) return false;
        const concept = String(c.core_concept || '').trim();
        const def = String(c.short_definition || '').trim();
        const q = String(c.main_question || '').trim();
        const ans = String(c.correct_answer || '').trim();
        const steps = Array.isArray(c.steps) ? c.steps.filter(Boolean) : [];
        const clozeIdx = Array.isArray(c.cloze_indices) && c.cloze_indices.length;
        /* Order mirrors `_challengeToFlashcard` so a card that "passes" the
           gate is guaranteed to also produce a flashcard. */
        return !!(
            (q && ans) ||
            (concept && def) ||
            (clozeIdx && def) ||
            (steps.length >= 2 && (concept || ans)) ||
            (concept && ans)
        );
    }

    _challengeToFlashcard(c, pass = 0) {
        const concept = String(c.core_concept || '').trim();
        const def = String(c.short_definition || '').trim();
        const q = String(c.main_question || '').trim();
        const ans = String(c.correct_answer || '').trim();
        const steps = Array.isArray(c.steps) ? c.steps.map((s) => String(s || '').trim()).filter(Boolean) : [];

        /* 1. Authored Q&A — the strongest learning signal because the
              author already framed both halves of the recall pair. */
        if (q && ans) {
            return { prompt: q, answer: ans, concept: concept || ans, kind: 'qa' };
        }

        /* 2. Concept + definition — rephrase the bare concept as a real
              question so the learner is asked for recall, not staring
              at a noun. */
        if (concept && def) {
            return {
                prompt: i18n('REVIEW_PROMPT_DEFINE', { concept }),
                answer: def,
                concept,
                kind: 'define'
            };
        }

        /* 3. Cloze — rotate the masked index by `pass` so the same card
              practices a different vocabulary word on repeat exposures
              instead of always blanking out the first word. */
        const cloze = this._buildClozePrompt(c, pass);
        if (cloze) {
            return {
                prompt: i18n('REVIEW_PROMPT_CLOZE') + '\n' + cloze.display,
                answer: cloze.answer,
                concept: concept || ans,
                kind: 'cloze'
            };
        }

        /* 4. Steps — frame as a question, not as the back-of-card eyebrow
              ("Answer: X"), which doesn't read like a prompt at all. */
        if (steps.length >= 2 && (concept || ans)) {
            const subject = concept || ans;
            return {
                prompt: i18n('REVIEW_PROMPT_STEPS', { concept: subject }),
                answer: steps.join(' → '),
                concept: subject,
                kind: 'steps'
            };
        }

        /* 5. Concept + answer fallback. Wrap the bare concept in
              "What is X?" so the prompt still reads like a question. */
        if (concept && ans) {
            return {
                prompt: i18n('REVIEW_PROMPT_DEFINE', { concept }),
                answer: ans,
                concept,
                kind: 'qa'
            };
        }

        return null;
    }

    /** Cloze prompt: replace the chosen word in `short_definition` with
     *  a blank so the prompt asks the learner to fill it. The chosen
     *  index rotates by `pass` so repeat reviews hit different blanks.
     *  Returns null when the schema doesn't have indices or the answer
     *  word resolves to whitespace. */
    _buildClozePrompt(c, pass = 0) {
        if (!c) return null;
        const indices = Array.isArray(c.cloze_indices)
            ? c.cloze_indices.filter((n) => Number.isFinite(n))
            : [];
        const def = String(c.short_definition || '').trim();
        if (!indices.length || !def) return null;
        const words = def.split(/\s+/);
        if (!words.length) return null;
        const safePass = Math.max(0, pass | 0);
        const rawIdx = indices[safePass % indices.length];
        const idx = Math.min(Math.max(0, rawIdx | 0), words.length - 1);
        const answer = words[idx];
        if (!answer) return null;
        const display = words.map((w, i) => (i === idx ? '_____' : w)).join(' ');
        return { display, answer };
    }

    _renderEmptyReviewCard(lesson) {
        const host = this.els.reviewCardHost;
        if (!host) return;
        const safeTitle = escapeHtml(String(lesson?.title || ''));
        host.innerHTML = `
            <div class="review-empty">
                <span class="review-empty-icon" aria-hidden="true">🌱</span>
                <p style="margin:0 0 .35rem;font-weight:800;color:#fef3c7">${escapeHtml(i18n('REVIEW_NO_QUIZ_TITLE'))}</p>
                <p style="margin:0;color:#94a3b8">${safeTitle}</p>
                <p style="margin:.6rem 0 0">${escapeHtml(i18n('REVIEW_NO_QUIZ_BODY'))}</p>
                <button type="button" class="review-skip-btn">${escapeHtml(i18n('REVIEW_SKIP'))}</button>
            </div>
        `;
    }

    _renderFlipCard(flashcard, lesson) {
        const host = this.els.reviewCardHost;
        if (!host) return;
        const isDue = this.review.index < this.review.dueCount;
        const lessonName = escapeHtml(String(lesson.title || '').slice(0, 60));
        const srsBadge = `SRS · ${this.review.index + 1}/${this.review.queue.length}${isDue ? ' ●' : ''}`;
        const concept = flashcard.concept && flashcard.concept !== flashcard.answer
            ? `<p class="flip-back-concept">${escapeHtml(flashcard.concept)}</p>` : '';
        host.innerHTML = `
            <div class="flip-card" id="review-flip" role="button" tabindex="0" aria-label="${escapeHtml(i18n('REVIEW_TAP_TO_FLIP'))}">
                <div class="flip-face front">
                    <div class="flip-card-head">
                        <span>${escapeHtml(srsBadge)}</span>
                        <span class="lesson-name">${lessonName}</span>
                    </div>
                    <div class="qmark" aria-hidden="true">?</div>
                    <p class="flip-front-prompt">${escapeHtml(flashcard.prompt)}</p>
                    <span class="flip-front-hint">${escapeHtml(i18n('REVIEW_TAP_TO_FLIP'))}</span>
                </div>
                <div class="flip-face back">
                    <div class="flip-card-head">
                        <span>${escapeHtml(srsBadge)}</span>
                        <span class="lesson-name">${lessonName}</span>
                    </div>
                    <p class="flip-back-eyebrow">${escapeHtml(i18n('REVIEW_BACK_EYEBROW'))}</p>
                    ${concept}
                    <p class="flip-back-answer">${escapeHtml(flashcard.answer)}</p>
                </div>
            </div>
        `;
        const flip = host.querySelector('#review-flip');
        if (flip) {
            flip.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this._flipReviewCard();
                }
            });
        }
    }

    _flipReviewCard() {
        if (this.review.phase !== 'front') return;
        const flip = this.els.reviewCardHost?.querySelector('#review-flip');
        if (!flip) return;
        flip.classList.add('is-flipped');
        this.review.phase = 'back';
        try { this.fx?.playFlipSound?.(); } catch (_) {}
        this._toggleRateActions(true);
    }

    /** Two-button SRS: the learner saw the answer *before* rating, so the
     *  only honest signals are "I knew it" (q=5) and "I need to see this
     *  again" (q=0).  Mid-confidence buttons are intentionally absent. */
    _gradeReviewCard(quality) {
        if (this.review.phase !== 'back') return;
        const lesson = this.review.currentLesson;
        if (lesson && window.arborito?.memory?.report) {
            try { window.arborito.memory.report(lesson.id, quality); } catch (_) {}
        }
        if (quality >= 4) {
            try { this.fx?.playMatchSound?.(2); } catch (_) {}
            try { window.arborito?.xp?.(50); } catch (_) {}
        } else {
            try { this.fx?.playErrorSound?.(); } catch (_) {}
        }
        this.review.index += 1;
        void this._renderNextReviewCard();
    }

    /** Empty-state path: skip the lesson without touching the SRS schedule. */
    _skipReviewCard() {
        this.review.index += 1;
        void this._renderNextReviewCard();
    }

    _showReviewVictory() {
        const reviewed = this.review.queue.length;
        this._toggleRateActions(false);
        this.els.victoryTitle.textContent = i18n('REVIEW_VICTORY_TITLE');
        this.els.victoryTitle.style.color = '#60a5fa';
        if (this.els.levelUpBanner) this.els.levelUpBanner.classList.add('hidden');
        if (this.els.finalScore) this.els.finalScore.innerText = String(reviewed);
        if (this.els.highScore) this.els.highScore.innerText = String(this.review.dueCount);
        if (this.els.finalScoreLabel) this.els.finalScoreLabel.textContent = i18n('REVIEW_DONE_TITLE') + ' ';
        /* "Reviewed N · Due M" — taken from the progress key minus the
         * trailing "due"/"fresh" word so it keeps its localised verb. */
        if (this.els.highScoreLabel) this.els.highScoreLabel.textContent = '✓ ';
        if (this.els.winsLine) this.els.winsLine.textContent = i18n('REVIEW_DONE_BODY');

        this.els.victoryScreen.classList.remove('hidden-fade');
    }

    restartSession() {
        this.progress = { level: 1, wins: 0 };
        saveProgress(this.progress);
        window.location.reload();
    }

    async loadRound({ advanceLesson, lessonOverride = null }) {
        this.els.loadText.innerText = i18n('LOADING_CRYSTALS');

        const { title, pairs, lessonId, isDue, lesson } = await this.generatePairs({
            advanceLesson,
            lessonOverride
        });

        this.state.currentLessonId = lessonId;
        this.state.isReviewMode = isDue;
        this.lastLesson = lesson;

        if (pairs && pairs.length > 0) {
            this.buildGrid(pairs);
            this.setTopicDisplay(title, isDue);
            this.updateProgressHud();
            this.els.roundLoader.classList.add('hidden');
            this.startGame();
        } else {
            throw new Error(i18n('SYNTHESIS_FAILED'));
        }
    }

    setTopicDisplay(title, isDue) {
        this.els.topic.innerHTML = '';
        this.els.topic.classList.remove('opacity-0');

        const titleEl = document.createElement('span');
        titleEl.textContent = title;
        this.els.topic.appendChild(titleEl);

        if (isDue) {
            const badge = document.createElement('span');
            badge.style.cssText = 'color:#60a5fa;margin-left:0.35rem';
            badge.textContent = `[${i18n('MODE_REVIEW')}]`;
            this.els.topic.appendChild(badge);
        }

        if (this.state.realPairCount < this.state.pairTarget) {
            const hint = document.createElement('div');
            hint.style.cssText =
                'font-size:0.65rem;color:#94a3b8;margin-top:0.25rem;line-height:1.25;max-width:14rem;white-space:normal';
            hint.textContent = i18n('FEW_PAIRS', { n: this.state.realPairCount });
            this.els.topic.appendChild(hint);
        }
    }

    async generatePairs({ advanceLesson = true, lessonOverride = null } = {}) {
        /* memory.due() lessons enter "watering mode" with distinct victory copy and SRS reporting. */
        if (!window.arborito?.ask || !window.arborito?.lesson) {
            throw new Error(i18n('NO_BRIDGE'));
        }

        const curriculum = window.arborito.lesson.list() || [];
        this.curriculumSize = curriculum.length;

        let lesson = lessonOverride;
        if (!lesson) {
            lesson = advanceLesson
                ? await window.arborito.lesson.next()
                : this.lastLesson || (await window.arborito.lesson.next());
        }
        if (!lesson) {
            throw new Error(i18n('NO_LESSON'));
        }

        this.lessonIndex = Math.max(
            0,
            curriculum.findIndex((l) => l && l.id === lesson.id)
        );

        let isDue = false;
        if (window.arborito.memory) {
            const dueList = window.arborito.memory.due();
            if (dueList?.includes(lesson.id)) {
                isDue = true;
            }
        }

        const pairCount = pairsForLevel(this.progress.level);
        const pairs = await window.arborito.matchPairs(lesson, { count: pairCount });

        return {
            title: lesson.title,
            pairs,
            lessonId: lesson.id,
            isDue,
            lesson
        };
    }

    handleError(msg) {
        this.els.loadText.innerText = msg;
        this.els.loadText.classList.add('text-red-500');
        this.els.btnStart.classList.remove('hidden');
        this.els.loadState.classList.add('hidden');
    }

    startGame() {
        this._showCardsView();
        this.els.startScreen.classList.add('hidden-fade');
        document.getElementById('game-ui').classList.remove('hidden');
    }

    buildGrid(pairs) {
        const maxSlots = MAX_PAIR_SLOTS;
        const maxCells = maxSlots * 2;
        const realPairs = pairs.filter((p) => p && p.t && p.d).slice(0, maxSlots);
        this.state.realPairCount = realPairs.length;
        if (!realPairs.length) {
            throw new Error(i18n('SYNTHESIS_FAILED'));
        }

        const playable = [];
        const faceSeen = new Set();
        realPairs.forEach((p, i) => {
            const norm = (s) =>
                String(s || '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .toLowerCase()
                    .replace(/^❓\s*/, '')
                    .replace(/[^\p{L}\p{N}\s]/gu, '');
            const term = String(p.t || '').trim();
            const def = String(p.d || '').trim();
            const nt = norm(term);
            const nd = norm(def);
            if (!nt || !nd || nt === nd) return;
            if (faceSeen.has(nt) || faceSeen.has(nd)) return;
            faceSeen.add(nt);
            faceSeen.add(nd);
            playable.push({ id: i, text: term, type: 'TERM' });
            playable.push({ id: i, text: def, type: 'DEF' });
        });
        if (!playable.length) {
            throw new Error(i18n('SYNTHESIS_FAILED'));
        }

        playable.sort(() => Math.random() - 0.5);
        const slotOrder = [...Array(maxCells).keys()].sort(() => Math.random() - 0.5);
        const chosenSlots = slotOrder.slice(0, playable.length);

        const gridSlots = Array(maxCells)
            .fill(null)
            .map(() => ({ empty: true, matched: false }));
        playable.forEach((card, idx) => {
            const si = chosenSlots[idx];
            gridSlots[si] = { ...card, matched: false, empty: false };
        });

        this.state.cards = gridSlots;
        this.state.totalPlayableCards = playable.length;

        this.els.grid.innerHTML = '';
        gridSlots.forEach((card, index) => {
            if (card.empty) {
                const wrap = document.createElement('div');
                wrap.className =
                    'card-container memory-slot-empty w-full h-20 md:h-28 lg:h-32 xl:h-40';
                wrap.innerHTML =
                    '<div class="memory-empty-inner" aria-hidden="true"><span class="memory-empty-icon">◇</span></div>';
                this.els.grid.appendChild(wrap);
                return;
            }

            const el = document.createElement('div');
            el.className = 'card-container w-full h-20 md:h-28 lg:h-32 xl:h-40';
            el.innerHTML = `
                <div class="card" data-index="${index}" data-id="${card.id}">
                    <div class="card-face face-front">
                        <span class="text-2xl md:text-4xl opacity-50">🌿</span>
                    </div>
                    <div class="card-face face-back border-b-4 ${card.type === 'TERM' ? 'border-emerald-500' : 'border-yellow-500'}">
                        <span>${card.text}</span>
                    </div>
                </div>
            `;
            const cardEl = el.querySelector('.card');
            bindMobileTap(cardEl, () => this.onCardClick(cardEl, index));
            this.els.grid.appendChild(el);
        });
    }

    onCardClick(el, index) {
        const c = this.state.cards[index];
        if (
            !c ||
            c.empty ||
            this.state.locked ||
            this.state.flipped.includes(index) ||
            c.matched
        ) {
            return;
        }

        el.classList.add('flipped');
        this.fx.playFlipSound();
        this.state.flipped.push(index);

        if (this.state.flipped.length === 2) {
            this.checkMatch();
        }
    }

    checkMatch() {
        /* Combo decays in gameLoop; streak multiplies base 100 pts by level tier. */
        this.state.locked = true;
        const [i1, i2] = this.state.flipped;

        if (i1 === undefined || i2 === undefined) {
            this.state.flipped = [];
            this.state.locked = false;
            return;
        }

        const c1 = this.state.cards[i1];
        const c2 = this.state.cards[i2];
        if (!c1 || !c2 || c1.empty || c2.empty) {
            this.state.flipped = [];
            this.state.locked = false;
            return;
        }
        const el1 = document.querySelector(`.card[data-index="${i1}"]`);
        const el2 = document.querySelector(`.card[data-index="${i2}"]`);

        if (c1.id === c2.id) {
            this.state.cards[i1].matched = true;
            this.state.cards[i2].matched = true;
            this.state.matchedCount += 2;

            this.state.combo++;
            this.state.comboTimer = 100;

            const points = Math.round(
                100 * this.state.combo * comboMultiplier(this.progress.level)
            );
            this.state.score += points;

            if (window.arborito) {
                window.arborito.xp(points);
            }
            this.els.score.innerText = this.state.score;

            setTimeout(() => {
                try {
                    if (el1) el1.classList.add('matched');
                    if (el2) el2.classList.add('matched');

                    if (el1 && el2) {
                        const rect = el1.getBoundingClientRect();
                        const rect2 = el2.getBoundingClientRect();
                        if (rect.width > 0)
                            this.fx.spawnBloom(rect.left + rect.width / 2, rect.top + rect.height / 2);
                        if (rect2.width > 0)
                            this.fx.spawnBloom(
                                rect2.left + rect2.width / 2,
                                rect2.top + rect2.height / 2
                            );
                    }

                    this.fx.growPlant();
                    this.fx.playMatchSound(this.state.combo);
                } catch (e) {
                    console.error('Visual Effect Error:', e);
                } finally {
                    this.state.flipped = [];
                    this.state.locked = false;

                    if (this.state.matchedCount === this.state.totalPlayableCards) {
                        this.triggerVictory();
                    }
                }
            }, 1200);
        } else {
            this.state.combo = 0;
            this.fx.playErrorSound();

            setTimeout(() => {
                if (el1) el1.classList.remove('flipped');
                if (el2) el2.classList.remove('flipped');
                this.state.flipped = [];
                this.state.locked = false;
            }, 700);
        }
    }

    triggerVictory() {
        setTimeout(() => {
            this.fx.playVictorySound();

            const prevLevel = this.progress.level;
            this.progress.wins += 1;
            this.progress.level += 1;
            saveProgress(this.progress);
            this.pendingLevelUp = this.progress.level > prevLevel;
            this.updateProgressHud();

            if (window.arborito?.memory) {
                const quality = this.state.score > 2000 ? 5 : 4;
                window.arborito.memory.report(this.state.currentLessonId, quality);
            }

            if (this.state.score > this.state.highScore) {
                this.state.highScore = this.state.score;
                if (window.arborito) {
                    window.arborito.save('high_score', this.state.highScore);
                }
            }

            this.els.finalScore.innerText = this.state.score;
            this.els.highScore.innerText = this.state.highScore;
            this.els.winsLine.textContent = i18n('WINS', { n: this.progress.wins });

            /* Restore the cards-mode victory copy (a previous review session may
             * have rewritten these labels). */
            this.els.finalScoreLabel.textContent = i18n('FINAL_SCORE');
            this.els.highScoreLabel.textContent = i18n('HIGH_SCORE');

            this.els.victoryTitle.textContent = this.state.isReviewMode
                ? i18n('VICTORY_REVIEW')
                : i18n('VICTORY_TITLE');
            this.els.victoryTitle.style.color = this.state.isReviewMode ? '#60a5fa' : '#facc15';

            if (this.pendingLevelUp) {
                this.els.levelUpBanner.textContent = i18n('LEVEL_UP', { n: this.progress.level });
                this.els.levelUpBanner.classList.remove('hidden');
            } else {
                this.els.levelUpBanner.classList.add('hidden');
            }

            this.els.victoryScreen.classList.remove('hidden-fade');

            for (let i = 0; i < 10; i++) setTimeout(() => this.fx.growPlant(), i * 200);
        }, 800);
    }
}

new MemoryGame();
