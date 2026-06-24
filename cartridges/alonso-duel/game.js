/**
 * Alonso Duel — shared central pool.
 *
 * Both fighters draw from one deck. Five cards stay face up on the table.
 * Each round Alonso picks first, then the player picks; the picker forces
 * the opponent to answer the chosen card. After every pick the pool tops
 * up from the deck so it stays at five. First to WIN_POINTS wins.
 */
import { DuelFX } from './fx.js';
import { buildCardsFromChallenge } from './card-modes.js';

/* Quiz V2 rendering helpers come from the SDK (window.arborito.challenge.modes). */
const sdkModes = (window.arborito && window.arborito.challenge && window.arborito.challenge.modes) || {};
const buildInteractionHtml = sdkModes.renderAnswers || (() => '');
const cardModeClass = sdkModes.className || (() => '');
const isSequenceMode = sdkModes.isOrdering || (() => false);
const checkSequenceAnswer = sdkModes.checkOrder || (() => false);

const WIN_POINTS = 100;
const TABLE_SIZE = 5;
const BLOCK_CHIP = 8;
const BLOCK_BONUS = 6;
const PERFECT_BLOCK_BONUS = 6;
const PERFECT_BLOCK_SEC = 3;
const WHIFF_DAMAGE = 14;
const BLOCK_TIME_SEC = 9;
const BLOCK_TIME_PER_SEQ_ITEM = 2;
const BLOCK_TIME_SEQ_MIN = 14;
const ALONSO_DEFENSE_BASE = 0.4;
const SPECIAL_MAX = 100;
const SPECIAL_GAIN_BLOCK = 22;
const SPECIAL_GAIN_ATTACK = 28;
const COMBO_BONUS_START = 2;
const COMBO_BONUS_PER = 4;
const REVIEW_DAMAGE_MULT = 1.45;
const COMPLETE_LESSON_MULT = 1.15;
const CRIT_MULT = 2;
const SHIELD_BLOCKS = 3;
const SAVE_KEY = 'alonso_duel_stats_v3';

const PAUSE_SHORT = 600;
const PAUSE_READ = 1500;
const PAUSE_THINK = 1100;
const PAUSE_REVEAL = 1300;
const PAUSE_RESULT = 1600;
/** Alonso word-order: ms per chip highlight (was 260 — too fast to follow). */
const ALONSO_SEQ_CHIP_MS = 380;
/** Beat after the last chip so the full order is readable. */
const ALONSO_SEQ_TAIL_MS = 1050;
/** Before the block timer starts on ordering cards, time to read the prompt. */
const BLOCK_SEQ_READ_BASE_MS = 400;
const BLOCK_SEQ_READ_PER_ITEM_MS = 100;
const BLOCK_SEQ_READ_MAX_MS = 1400;

const T = {
    ES: {
        START_TITLE: 'Duelo vs Alonso',
        START_DESC: 'Mesa compartida con 5 cartas siempre a la vista. Elige una para que Alonso responda, y prepárate cuando él elija una para ti. ¡Primero en 100 puntos gana!',
        START_HINT: 'Tus lecciones tienen que incluir cuestionario. Pulsa ? para ver las reglas.',
        START_FEATURES: [
            'Mazo común y 5 cartas en el centro de la mesa',
            'Cada ronda: Alonso elige una para ti, luego tú eliges una para él',
            '5 modalidades: opción múltiple, recuerda, hueco, ordenar palabras, pasos',
            'Combos, bloqueos perfectos, escudo y críticos por barra de Poder',
            'Repaso espaciado y bonus por lecciones dominadas'
        ],
        LOADING: 'Barajando el mazo y preparando la arena…',
        START: '¡Al duelo!',
        NEED_QUIZ: 'Antes de jugar añade preguntas a tus lecciones desde el curso.',
        NO_BRIDGE: 'No se pudo conectar con el curso. Vuelve al menú e inténtalo otra vez.',
        DECK: 'Mazo',
        SHARED_DECK: 'Mazo común',
        DISCARD: 'Descarte',
        TABLE: 'Mesa',
        TABLE_HINT_PLAYER: 'Toca una carta para que Alonso la responda',
        TABLE_HINT_ALONSO: 'Alonso elige carta…',
        TABLE_HINT_BLOCK: 'Bloquea respondiendo (1–4)',
        TABLE_HINT_ATTACK: 'Alonso responde tu carta…',
        FADING_BADGE: 'Olvido',
        DECK_META: '{deck} en mazo · Mesa {table}/{max} · Descarte {discard}',
        PHASE_ALONSO_PICKS: 'Alonso elige carta…',
        PHASE_BLOCK: '¡Tu defensa! — responde',
        PHASE_PLAYER_PICKS: 'Tu turno — elige carta',
        PHASE_PLAYER_ATTACK: 'Alonso debe responder',
        BTN_CRIT_HINT: '¡Próxima carta crítica!',
        SPECIAL: 'Poder',
        ROUND: 'Ronda {n}',
        REVIEW_BADGE: 'Repaso',
        COMPLETE_BADGE: 'Maestría',
        START_STATS: 'Victorias: {w} · Mejor combo: x{c}',
        START_STATS_NEW: 'Tu primer duelo te espera.',
        ALONSO_THINKS: 'Alonso está pensando…',
        ALONSO_PICKS: 'Alonso responde: «{ans}»',
        YOU_BLOCK_OK: '¡Bloqueado! +{n} pts',
        YOU_BLOCK_FAIL: 'Te alcanzó. Alonso +{n} pts',
        YOU_BLOCK_TIMEOUT: '¡Tiempo! Alonso +{n} pts',
        YOU_ATTACK_OK: '¡Impacto! Tú +{n} pts',
        YOU_ATTACK_CRIT: '¡CRÍTICO! Tú +{n} pts',
        YOU_ATTACK_FAIL: 'Alonso bloqueó. Él +{n} pts',
        YOU_WIN: '¡Victoria! Derrotaste a Alonso.',
        ALONSO_WIN: 'Alonso gana el duelo.',
        REPLAY: 'Revancha',
        PTS: 'Puntos',
        BANNER_ALONSO_PICKS: 'Alonso ataca con «{name}»',
        BANNER_BLOCK: 'Bloquea respondiendo',
        BANNER_YOUR_TURN: 'Tu turno · elige carta',
        BANNER_HIT_YOU: 'Alonso anota +{n}',
        BANNER_HIT_ALONSO: 'Le anotaste +{n}',
        BANNER_PERFECT_BLOCK: '¡Bloqueo perfecto! +{n}',
        BANNER_BLOCK_OK: '¡Bloqueaste!',
        BANNER_TIMEOUT: '¡Tiempo!',
        BANNER_SHIELD_ABSORB: 'Escudo absorbió el golpe',
        BANNER_CRIT: '¡CRÍTICO! +{n}',
        BANNER_COMBO: 'Combo x{n}',
        DAMAGE_YOU: '+{n}',
        DAMAGE_FOE: '+{n}',
        COMBO: 'x{n} COMBO +{b}',
        END_BONUS: '+{n} XP · repaso registrado',
        END_BONUS_XP: '+{n} XP',
        SHIELD_READY: 'Escudo activo — absorbe el próximo golpe',
        DECK_LEFT: 'Mazo: {n}',
        REVIEW_DUE: '{n} lecciones en repaso',
        TAUNTS_THINK: ['Mmm, déjame ver…', 'Esta me la sé.', 'Fácil. Mira.', 'Predecible.'],
        TAUNTS_HIT_YOU: ['¡Ja! Te di de lleno.', 'Caíste solito.', 'Siéntate.'],
        TAUNTS_BLOCKED: ['Nada mal. Pero poco.', 'Tuviste suerte.', 'Un respiro.'],
        TAUNTS_HIT_ALONSO: ['Tch.', 'Pura suerte.', 'Me agarraste… por hoy.'],
        TAUNTS_DODGED: ['Muy lento.', 'Esfuérzate.', 'Te vi venir.'],
        RULES_TITLE: 'Reglas del duelo',
        RULES_CLOSE: 'Entendido',
        RULES_ITEMS: [
            'Objetivo: llega a 100 puntos antes que Alonso.',
            'Mazo común: ambos roban del mismo mazo. Siempre hay 5 cartas en la mesa.',
            'Cada ronda Alonso elige primero una carta para ti; tú la respondes.',
            'Después tú eliges una para Alonso y él la responde.',
            'Acertar al bloquear o al atacar carga la barra de Poder; al llenarse desbloquea un crítico (x2).',
            'Tres bloqueos seguidos activan un escudo que absorbe el próximo golpe.',
            'Las cartas en repaso o de lecciones dominadas hacen más daño.'
        ],
        BTN_RULES: 'Reglas'
    },
    EN: {
        START_TITLE: 'Duel vs Alonso',
        START_DESC: 'Shared table with 5 cards face up. Pick one to force Alonso to answer it; brace yourself when he picks one for you. First to 100 points wins.',
        START_HINT: 'Your lessons need questionnaires. Tap ? for rules.',
        START_FEATURES: [
            'Shared deck with 5 cards always on the table',
            'Each round: Alonso picks one for you, then you pick one for him',
            '5 modes: MC, recall, cloze, word order, steps',
            'Combos, perfect blocks, shield and crits via Power bar',
            'Spaced review and a bonus for mastered lessons'
        ],
        LOADING: 'Shuffling the deck and preparing the arena…',
        START: 'Enter the duel!',
        NEED_QUIZ: 'Add questions to your lessons before playing.',
        NO_BRIDGE: "Couldn't connect to the course. Go back to the menu and try again.",
        DECK: 'Deck',
        SHARED_DECK: 'Shared deck',
        DISCARD: 'Discard',
        TABLE: 'Table',
        TABLE_HINT_PLAYER: 'Tap a card so Alonso has to answer it',
        TABLE_HINT_ALONSO: 'Alonso is choosing a card…',
        TABLE_HINT_BLOCK: 'Block by answering (keys 1–4)',
        TABLE_HINT_ATTACK: 'Alonso answers your card…',
        FADING_BADGE: 'Fading',
        DECK_META: '{deck} in deck · Table {table}/{max} · Discard {discard}',
        PHASE_ALONSO_PICKS: 'Alonso is choosing…',
        PHASE_BLOCK: 'Your defense — answer!',
        PHASE_PLAYER_PICKS: 'Your turn — pick a card',
        PHASE_PLAYER_ATTACK: 'Alonso must answer',
        BTN_CRIT_HINT: 'Next card is a critical!',
        SPECIAL: 'Power',
        ROUND: 'Round {n}',
        REVIEW_BADGE: 'Review',
        COMPLETE_BADGE: 'Mastery',
        START_STATS: 'Wins: {w} · Best combo: x{c}',
        START_STATS_NEW: 'Your first duel awaits.',
        ALONSO_THINKS: 'Alonso is thinking…',
        ALONSO_PICKS: 'Alonso answers: «{ans}»',
        YOU_BLOCK_OK: 'Blocked! +{n} pts',
        YOU_BLOCK_FAIL: 'Hit taken. Alonso +{n} pts',
        YOU_BLOCK_TIMEOUT: 'Time up! Alonso +{n} pts',
        YOU_ATTACK_OK: 'Direct hit! You +{n} pts',
        YOU_ATTACK_CRIT: 'CRITICAL! You +{n} pts',
        YOU_ATTACK_FAIL: 'Alonso blocked. He +{n} pts',
        YOU_WIN: 'Victory! You defeated Alonso.',
        ALONSO_WIN: 'Alonso wins the duel.',
        REPLAY: 'Rematch',
        PTS: 'Points',
        BANNER_ALONSO_PICKS: 'Alonso strikes with «{name}»',
        BANNER_BLOCK: 'Block by answering',
        BANNER_YOUR_TURN: 'Your turn · pick a card',
        BANNER_HIT_YOU: 'Alonso scores +{n}',
        BANNER_HIT_ALONSO: 'You scored +{n}',
        BANNER_PERFECT_BLOCK: 'Perfect block! +{n}',
        BANNER_BLOCK_OK: 'Blocked!',
        BANNER_TIMEOUT: 'Time up!',
        BANNER_SHIELD_ABSORB: 'Shield absorbed the hit',
        BANNER_CRIT: 'CRITICAL! +{n}',
        BANNER_COMBO: 'Combo x{n}',
        DAMAGE_YOU: '+{n}',
        DAMAGE_FOE: '+{n}',
        COMBO: 'x{n} COMBO +{b}',
        END_BONUS: '+{n} XP · review logged',
        END_BONUS_XP: '+{n} XP',
        SHIELD_READY: 'Shield active — absorbs next hit',
        DECK_LEFT: 'Deck: {n}',
        REVIEW_DUE: '{n} lessons due for review',
        TAUNTS_THINK: ['Hmm, let me see…', 'I know this one.', 'Easy. Watch this.', 'Predictable.'],
        TAUNTS_HIT_YOU: ['Ha! Right on the chin.', 'You walked into that.', 'Sit down.'],
        TAUNTS_BLOCKED: ['Not bad. Not enough.', 'Lucky.', 'A small reprieve.'],
        TAUNTS_HIT_ALONSO: ['Tch.', 'A fluke.', 'You got me… this time.'],
        TAUNTS_DODGED: ['Too slow.', 'Try harder.', 'I see through it.'],
        RULES_TITLE: 'Duel rules',
        RULES_CLOSE: 'Got it',
        RULES_ITEMS: [
            'Goal: reach 100 points before Alonso.',
            'Shared deck: both draw from the same pile. The table always shows 5 cards.',
            'Every round Alonso picks one card for you to answer first.',
            'Then you pick one for him and he tries to answer it.',
            'Correct blocks and attacks fill the Power bar; when full, your next attack crits (x2).',
            'Three blocks in a row activate a shield that absorbs the next hit.',
            'Cards from review or mastered lessons deal more damage.'
        ],
        BTN_RULES: 'Rules'
    }
};

function detectLang() {
    const u = window.arborito && window.arborito.user && window.arborito.user.lang;
    return u === 'EN' ? 'EN' : 'ES';
}

const lang = detectLang();

const i18n = (key, vars = {}) => {
    let s = (T[lang] && T[lang][key]) || T.ES[key] || T.EN[key] || key;
    Object.keys(vars).forEach((k) => {
        s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
    });
    return s;
};

function pickTaunt(key) {
    const list = (T[lang] && T[lang][key]) || T.ES[key] || [];
    if (!Array.isArray(list) || !list.length) return '';
    return list[Math.floor(Math.random() * list.length)];
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** @param {ParentNode|null} slot */
function seqTargetEl(slot) {
    return slot?.querySelector?.('[data-seq-target]') || null;
}

/** @param {ParentNode|null} slot */
function seqPoolEl(slot) {
    return slot?.querySelector?.('[data-seq-pool]') || null;
}

/** @param {ParentNode|null} slot */
function seqPickedWords(slot) {
    const target = seqTargetEl(slot);
    if (!target) return [];
    return [...target.querySelectorAll('.seq-chip')].map((c) => c.dataset.chip || '');
}

/** Take the next matching chip from the pool (handles duplicate words). */
function seqTakeChipFromPool(pool, word, usedIdx) {
    if (!pool) return null;
    for (const chip of pool.querySelectorAll('.seq-chip')) {
        if ((chip.dataset.chip || '') !== word) continue;
        const key = chip.dataset.chipIdx || chip.dataset.chip || '';
        if (usedIdx.has(key)) continue;
        usedIdx.add(key);
        return chip;
    }
    return null;
}

function seqRefreshTargetPlaceholder(target) {
    if (!target) return;
    const ph = target.querySelector('.seq-target-ph');
    if (!ph) return;
    ph.style.display = target.querySelector('.seq-chip') ? 'none' : '';
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
}

function cardUid(card) {
    return `${card.mode || 'multiple'}::${card.question}::${card.correct}::${card.name}`;
}

function cardGlyph(name) {
    const s = String(name || '').trim();
    if (!s) return '?';
    const m = s.match(/[\p{L}\p{N}]/u);
    return (m ? m[0] : s.charAt(0)).toUpperCase();
}

function getLessonChallenges(lesson) {
    if (!lesson) return [];
    if (lesson.challenges?.length) return lesson.challenges;
    if (lesson.challenge) return [lesson.challenge];
    return [];
}

function cardDamage(card) {
    /* Review/complete-lesson flags scale damage to match SRS urgency and mastery rewards. */
    let base = Math.max(12, Math.min(28, Math.floor((card.power || 50) / 4)));
    if (card.isReview) base = Math.round(base * REVIEW_DAMAGE_MULT);
    if (card.isCompleteLesson) base = Math.round(base * COMPLETE_LESSON_MULT);
    return base;
}

function blockTimeForCard(card) {
    if (isSequenceMode(card)) {
        const n = (card.sequence || card.chips || []).length;
        return Math.max(BLOCK_TIME_SEQ_MIN, BLOCK_TIME_SEC + Math.max(0, n - 2) * BLOCK_TIME_PER_SEQ_ITEM);
    }
    if (card?.mode === 'cloze' || card?.mode === 'recall') return BLOCK_TIME_SEC + 2;
    return BLOCK_TIME_SEC;
}

function loadStats() {
    try {
        if (window.arborito && window.arborito.load) {
            const s = window.arborito.load(SAVE_KEY);
            if (s && typeof s === 'object') return s;
        }
    } catch (_) {}
    return { wins: 0, losses: 0, bestCombo: 0 };
}

function saveStats(stats) {
    try {
        if (window.arborito && window.arborito.save) {
            window.arborito.save(SAVE_KEY, stats);
        }
    } catch (_) {}
}

class AlonsoDuel {
    constructor() {
        this.pool = [];
        this.drawPile = [];
        this.tableCards = [];
        this.you = 0;
        this.alonso = 0;
        this.round = 0;
        this.locked = false;
        this.lessonIds = new Set();
        this.primaryLessonId = null;
        this.dueLessonIds = new Set();
        this.blockStreak = 0;
        this.attackStreak = 0;
        this.specialMeter = 0;
        this.critReady = false;
        this.shieldActive = false;
        this.uiMode = 'idle';
        this.activeCard = null;
        this._blockStartTime = 0;
        this._blockTimerTick = null;
        this._keyHandler = null;
        this._tableKeyHandler = null;
        this._tablePickResolve = null;
        this.stats = loadStats();

        this.fx = new DuelFX(document.getElementById('bg-canvas'));

        this.els = {
            startOverlay: document.getElementById('start-overlay'),
            app: document.getElementById('app'),
            endOverlay: document.getElementById('end-overlay'),
            btnStart: document.getElementById('btn-start'),
            btnReplay: document.getElementById('btn-replay'),
            btnRules: document.getElementById('btn-rules'),
            btnRulesClose: document.getElementById('btn-rules-close'),
            rulesOverlay: document.getElementById('rules-overlay'),
            rulesList: document.getElementById('rules-list'),
            loadingText: document.getElementById('loading-text'),
            scoreYou: document.getElementById('score-you'),
            scoreAlonso: document.getElementById('score-alonso'),
            hpFillYou: document.getElementById('hp-fill-you'),
            hpFillAlonso: document.getElementById('hp-fill-alonso'),
            phaseBanner: document.getElementById('phase-banner'),
            tableHint: document.getElementById('table-hint'),
            tablePool: document.getElementById('table-pool'),
            battleSlot: document.getElementById('battle-slot'),
            battleStage: document.getElementById('battle-stage'),
            sharedDeckCount: document.getElementById('shared-deck-count'),
            discardPile: document.getElementById('discard-pile'),
            discardCount: document.getElementById('discard-count'),
            endTitle: document.getElementById('end-title'),
            endScores: document.getElementById('end-scores'),
            endBonus: document.getElementById('end-bonus'),
            endEmoji: document.getElementById('end-emoji'),
            floatLayer: document.getElementById('float-layer'),
            eventBannerStack: document.getElementById('event-banner-stack'),
            winTarget: document.getElementById('win-target'),
            winTargetYou: document.getElementById('win-target-you'),
            roundBadge: document.getElementById('round-badge'),
            specialFill: document.getElementById('special-fill'),
            specialWrap: document.getElementById('special-meter-wrap'),
            specialLabel: document.getElementById('special-label'),
            blockTimer: document.getElementById('block-timer'),
            blockTimerFill: document.getElementById('block-timer-fill'),
            blockTimerNum: document.getElementById('block-timer-num'),
            duelMat: document.getElementById('duel-mat'),
            startFeatures: document.getElementById('start-features'),
            startStats: document.getElementById('start-stats'),
            shieldBadge: document.getElementById('shield-badge'),
            reviewDueChip: document.getElementById('review-due-chip'),
            critHint: document.getElementById('crit-hint'),
            battleLog: document.getElementById('battle-log'),
            alonsoSpeech: document.getElementById('alonso-speech')
        };
        this._tableCardEls = new Map();
        this._alonsoSpeechTimer = null;

        this._bindStaticUi();
        this.els.btnStart.onclick = () => this.start();
        this.els.btnReplay.onclick = () => this.reset();
        if (this.els.btnRules) this.els.btnRules.onclick = () => this.openRules();
        if (this.els.btnRulesClose) this.els.btnRulesClose.onclick = () => this.closeRules();
        const btnStartRules = document.getElementById('btn-start-rules');
        if (btnStartRules) btnStartRules.onclick = () => this.openRules();
    }

    openRules() {
        if (this.els.rulesOverlay) this.els.rulesOverlay.classList.remove('hidden');
    }

    closeRules() {
        if (this.els.rulesOverlay) this.els.rulesOverlay.classList.add('hidden');
    }

    _bindStaticUi() {
        document.getElementById('start-title').textContent = i18n('START_TITLE');
        document.getElementById('start-desc').textContent = i18n('START_DESC');
        document.getElementById('start-hint').textContent = i18n('START_HINT');
        this.els.btnStart.textContent = i18n('START');
        this.els.btnReplay.textContent = i18n('REPLAY');
        const rulesTitle = document.getElementById('rules-title');
        if (rulesTitle) rulesTitle.textContent = i18n('RULES_TITLE');
        if (this.els.btnRulesClose) this.els.btnRulesClose.textContent = i18n('RULES_CLOSE');
        if (this.els.btnRules) this.els.btnRules.setAttribute('aria-label', i18n('BTN_RULES'));
        const rulesItems = T[lang]?.RULES_ITEMS || T.ES.RULES_ITEMS;
        if (this.els.rulesList) {
            this.els.rulesList.innerHTML = rulesItems.map((r) => `<li>${escapeHtml(r)}</li>`).join('');
        }
        const btnStartRules = document.getElementById('btn-start-rules');
        if (btnStartRules) btnStartRules.textContent = i18n('BTN_RULES');
        this.els.specialLabel.textContent = i18n('SPECIAL');
        const features = T[lang]?.START_FEATURES || T.ES.START_FEATURES;
        this.els.startFeatures.innerHTML = features.map((f) => `<li>${escapeHtml(f)}</li>`).join('');
        if (this.stats.wins > 0 || this.stats.losses > 0) {
            this.els.startStats.textContent = i18n('START_STATS', {
                w: this.stats.wins,
                c: this.stats.bestCombo || 0
            });
        } else {
            this.els.startStats.textContent = i18n('START_STATS_NEW');
        }
        const userName =
            window.arborito && window.arborito.user && window.arborito.user.username
                ? String(window.arborito.user.username)
                : lang === 'EN' ? 'You' : 'Tú';
        document.getElementById('you-name').textContent = userName;
        document.getElementById('hp-label-you').textContent = i18n('PTS');
        document.getElementById('hp-label-alonso').textContent = i18n('PTS');
        if (this.els.winTarget) this.els.winTarget.textContent = String(WIN_POINTS);
        if (this.els.winTargetYou) this.els.winTargetYou.textContent = String(WIN_POINTS);
        this._applyUserAvatar();
    }

    _applyUserAvatar() {
        const el = document.getElementById('player-portrait');
        if (!el) return;
        const av = window.arborito && window.arborito.user && window.arborito.user.avatar
            ? String(window.arborito.user.avatar).trim() : '';
        if (!av) return;
        if (/^https?:\/\//i.test(av) || av.startsWith('data:')) {
            el.innerHTML = `<img class="fighter-portrait__media" src="${escapeAttr(av)}" alt="" />`;
        } else {
            el.innerHTML = `<span class="fighter-portrait__emoji" aria-hidden="true">${escapeHtml(av)}</span>`;
        }
    }

    setPlayerMood(mood) {
        const p = document.getElementById('player-portrait');
        if (p) p.dataset.mood = mood;
    }

    setAlonsoMood(mood) {
        const p = document.getElementById('alonso-portrait');
        if (p) p.dataset.mood = mood;
    }

    _updateRoundBadge() {
        if (this.els.roundBadge) this.els.roundBadge.textContent = i18n('ROUND', { n: this.round });
    }

    _updateSpecialMeter() {
        const pct = Math.min(100, this.specialMeter);
        if (this.els.specialFill) this.els.specialFill.style.width = `${pct}%`;
        this.critReady = pct >= SPECIAL_MAX;
        if (this.els.specialWrap) this.els.specialWrap.classList.toggle('is-ready', this.critReady);
        if (this.els.critHint) {
            this.els.critHint.classList.toggle('hidden', !(this.critReady && this.uiMode === 'player-pick'));
            this.els.critHint.textContent = i18n('BTN_CRIT_HINT');
        }
    }

    _gainSpecial(amount) {
        this.specialMeter = Math.min(SPECIAL_MAX, this.specialMeter + amount);
        this._updateSpecialMeter();
    }

    _spendSpecial() {
        this.specialMeter = 0;
        this.critReady = false;
        this._updateSpecialMeter();
    }

    comboBonus() {
        const streak = Math.max(this.blockStreak, this.attackStreak);
        if (streak < COMBO_BONUS_START) return 0;
        return (streak - COMBO_BONUS_START + 1) * COMBO_BONUS_PER;
    }

    floatDamage(side, amount, { crit = false } = {}) {
        if (!this.els.floatLayer || !amount) return;
        const el = document.createElement('span');
        el.className = `dmg-float dmg-float--${side}${crit ? ' dmg-float--crit' : ''}`;
        el.textContent = i18n(side === 'you' ? 'DAMAGE_YOU' : 'DAMAGE_FOE', { n: amount });
        const x = side === 'you' ? 28 + Math.random() * 18 : 52 + Math.random() * 18;
        el.style.left = `${x}%`;
        this.els.floatLayer.appendChild(el);
        setTimeout(() => el.remove(), 1100);
    }

    sparkBurst(side, color) {
        if (!this.els.floatLayer) return;
        const originY = side === 'you' ? 78 : 22;
        const originX = side === 'you' ? 38 + Math.random() * 18 : 50 + Math.random() * 18;
        const palette = color || (side === 'you' ? '#6ee7b7' : '#fb923c');
        for (let i = 0; i < 12; i++) {
            const s = document.createElement('span');
            s.className = 'spark';
            s.style.left = `${originX}%`;
            s.style.top = `${originY}%`;
            s.style.background = palette;
            const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
            const dist = 40 + Math.random() * 50;
            s.style.setProperty('--sx', `${Math.cos(angle) * dist}px`);
            s.style.setProperty('--sy', `${Math.sin(angle) * dist - 12}px`);
            s.style.animationDelay = `${Math.random() * 0.08}s`;
            this.els.floatLayer.appendChild(s);
            setTimeout(() => s.remove(), 750);
        }
        this.fx.burst((originX / 100) * window.innerWidth, (originY / 100) * window.innerHeight, palette);
    }

    setAlonsoTaunt(key) {
        const line = pickTaunt(key);
        if (line) this.showAlonsoSpeech(line);
    }

    /** Show what Alonso is saying in a speech bubble next to his portrait so
     *  the player can actually read it. The bubble auto-fades after `holdMs`
     *  unless overwritten by a newer line. The battle-log narration is left
     *  to summarize the *result* of the exchange. */
    showAlonsoSpeech(line, { holdMs = 2200 } = {}) {
        const el = this.els.alonsoSpeech;
        if (!el || !line) return;
        clearTimeout(this._alonsoSpeechTimer);
        el.classList.remove('hidden', 'is-fading');
        el.textContent = String(line);
        this._alonsoSpeechTimer = setTimeout(() => {
            el.classList.add('is-fading');
            this._alonsoSpeechTimer = setTimeout(() => {
                el.classList.add('hidden');
                el.classList.remove('is-fading');
                el.textContent = '';
            }, 350);
        }, holdMs);
    }

    clearAlonsoSpeech() {
        const el = this.els.alonsoSpeech;
        if (!el) return;
        clearTimeout(this._alonsoSpeechTimer);
        el.classList.add('hidden');
        el.classList.remove('is-fading');
        el.textContent = '';
    }

    setLog(msg) {
        if (this.els.battleLog) this.els.battleLog.textContent = msg || '';
    }

    setPhase(text, who) {
        if (!this.els.phaseBanner) return;
        this.els.phaseBanner.textContent = text;
        this.els.phaseBanner.classList.remove('is-alonso', 'is-you', 'is-flash');
        if (who === 'alonso') this.els.phaseBanner.classList.add('is-alonso');
        if (who === 'you') this.els.phaseBanner.classList.add('is-you');
        void this.els.phaseBanner.offsetWidth;
        this.els.phaseBanner.classList.add('is-flash');
    }

    setTableHint(key) {
        if (!this.els.tableHint) return;
        this.els.tableHint.textContent = key ? i18n(key) : '';
    }

    announce(text, { tone = null, icon = null, key = null } = {}) {
        const stack = this.els.eventBannerStack;
        if (!stack || !text) return;
        if (key) {
            const prev = stack.querySelector(`[data-banner-key="${key}"]`);
            if (prev) prev.remove();
        }
        const el = document.createElement('div');
        el.className = 'event-banner' + (tone ? ' is-' + tone : '');
        if (key) el.dataset.bannerKey = key;
        const iconHtml = icon ? `<span class="event-banner-icon" aria-hidden="true">${escapeHtml(icon)}</span>` : '';
        el.innerHTML = `${iconHtml}<span class="event-banner-text">${escapeHtml(text)}</span>`;
        stack.appendChild(el);
        const removeAfter = (ev) => {
            if (ev && ev.animationName !== 'eventBannerOut') return;
            el.removeEventListener('animationend', removeAfter);
            if (el.parentNode) el.parentNode.removeChild(el);
        };
        el.addEventListener('animationend', removeAfter);
        while (stack.children.length > 3) stack.removeChild(stack.firstChild);
    }

    updateHp() {
        this.els.scoreYou.textContent = String(this.you);
        this.els.scoreAlonso.textContent = String(this.alonso);
        this.els.hpFillYou.style.width = `${Math.min(100, (this.you / WIN_POINTS) * 100)}%`;
        this.els.hpFillAlonso.style.width = `${Math.min(100, (this.alonso / WIN_POINTS) * 100)}%`;
    }

    pulseHp(side) {
        const fill = side === 'you' ? this.els.hpFillYou : this.els.hpFillAlonso;
        if (!fill) return;
        fill.classList.remove('hp-pulse');
        void fill.offsetWidth;
        fill.classList.add('hp-pulse');
    }

    screenShake(intensity = 1) {
        const root = document.getElementById('duel-shake-root');
        if (!root) return;
        root.classList.remove('is-shake', 'is-shake-heavy');
        void root.offsetWidth;
        root.classList.add('is-shake');
        if (intensity > 1) root.classList.add('is-shake-heavy');
        setTimeout(() => root.classList.remove('is-shake', 'is-shake-heavy'), 420);
    }

    /* ----------------------------------------------------------------- */
    /* Score: scoreSide adds points to the named fighter — no negatives,  */
    /* no cross-fire. Both fighters race to WIN_POINTS.                   */
    /* ----------------------------------------------------------------- */
    scoreSide(side, amount, { shake = false, crit = false } = {}) {
        if (!amount || amount <= 0) return;
        if (side === 'you') this.you = Math.min(WIN_POINTS, this.you + amount);
        else this.alonso = Math.min(WIN_POINTS, this.alonso + amount);
        this.updateHp();
        this.pulseHp(side);
        this.floatDamage(side, amount, { crit });
        if (shake) this.screenShake(side === 'you' ? 1 : 1.2);
    }

    _consumeShield() {
        if (!this.shieldActive) return false;
        this.shieldActive = false;
        this._updateShieldBadge();
        return true;
    }

    _maybeGrantShield() {
        if (this.blockStreak >= SHIELD_BLOCKS && !this.shieldActive) {
            this.shieldActive = true;
            this._updateShieldBadge();
            this.fx.playBlock();
        }
    }

    _updateShieldBadge() {
        if (!this.els.shieldBadge) return;
        this.els.shieldBadge.classList.toggle('is-active', this.shieldActive);
        this.els.shieldBadge.title = this.shieldActive ? i18n('SHIELD_READY') : '';
    }

    _updateDeckRemaining() {
        const deckN = String(this.drawPile.length);
        const discN = String(this.discardCount || 0);
        if (this.els.sharedDeckCount) this.els.sharedDeckCount.textContent = deckN;
        if (this.els.discardCount) this.els.discardCount.textContent = discN;
        if (this.els.discardPile) this.els.discardPile.classList.toggle('has-cards', (this.discardCount || 0) > 0);
    }

    _toDiscard() {
        this.discardCount = (this.discardCount || 0) + 1;
        this._updateDeckRemaining();
    }

    _updateReviewDueChip() {
        if (!this.els.reviewDueChip) return;
        const n = this.dueLessonIds.size;
        if (n > 0) {
            this.els.reviewDueChip.textContent = i18n('REVIEW_DUE', { n });
            this.els.reviewDueChip.classList.remove('hidden');
        } else {
            this.els.reviewDueChip.classList.add('hidden');
        }
    }

    cardBadgesHtml(card) {
        const parts = [];
        if (card.isReview) parts.push(`<span class="play-card-badge play-card-badge--review">${escapeHtml(i18n('REVIEW_BADGE'))}</span>`);
        if (card.isCompleteLesson) parts.push(`<span class="play-card-badge play-card-badge--master">${escapeHtml(i18n('COMPLETE_BADGE'))}</span>`);
        if (card.isFading) parts.push(`<span class="play-card-badge play-card-badge--fading">${escapeHtml(i18n('FADING_BADGE'))}</span>`);
        return parts.join('');
    }
}

/* Part 3 is appended to the AlonsoDuel class as additional prototype methods.
 * It must be `cat`-ed *inside* the class body, so we ship it as method
 * declarations attached to the prototype after the class closes.
 */
Object.assign(AlonsoDuel.prototype, {
    expandLessonCards(lesson, baseCards) {
        const out = [];
        const lessonId = lesson.id;
        const isReview = this.dueLessonIds.has(lessonId);
        const memStatus = window.arborito?.memory?.getStatus?.(lessonId);
        const isFading = !isReview && memStatus && memStatus.health < 0.55 && memStatus.health > 0;
        for (const baseCard of baseCards) {
            const c = baseCard._challenge || lesson.challenge;
            const completeness = window.arborito?.challenge?.getCompleteness?.(c);
            const isCompleteLesson = completeness?.complete ?? false;
            out.push({
                ...baseCard,
                lessonId,
                isReview,
                isFading,
                isCompleteLesson,
                uid: cardUid({ ...baseCard, name: baseCard.name })
            });
        }
        return out;
    },

    async loadPool() {
        if (!window.arborito || !window.arborito.lesson) {
            throw new Error(i18n('NO_BRIDGE'));
        }
        this.dueLessonIds = new Set(window.arborito.memory?.due?.() || []);
        const hasReview = this.dueLessonIds.size > 0;
        if (this.els.duelMat) this.els.duelMat.classList.toggle('is-review', hasReview);
        this.fx.setReviewMode(hasReview);

        const pool = [];
        const seen = new Set();
        const loadedLessonIds = new Set();

        const addLesson = async (lesson) => {
            if (!lesson || loadedLessonIds.has(lesson.id)) return;
            const challenges = getLessonChallenges(lesson);
            if (!challenges.length) return;
            loadedLessonIds.add(lesson.id);
            this.lessonIds.add(lesson.id);
            if (!this.primaryLessonId) this.primaryLessonId = lesson.id;
            for (const challenge of challenges) {
                if (!challenge?.main_question && !challenge?.core_concept && !challenge?.short_definition) continue;
                const scopedLesson = { ...lesson, challenge };
                const title = lesson.title || 'Lesson';
                let cards = buildCardsFromChallenge(challenge, title, lang);
                if (!cards?.length && window.arborito.challenge?.buildDuelDeck) {
                    cards = window.arborito.challenge.buildDuelDeck(scopedLesson) || [];
                }
                if (!cards?.length) continue;
                for (const card of this.expandLessonCards(scopedLesson, cards)) {
                    if (seen.has(card.uid)) continue;
                    seen.add(card.uid);
                    pool.push({ ...card, atk: cardDamage(card) });
                }
            }
        };

        const curriculum = window.arborito.lesson.list?.() || [];
        for (let i = 0; i < curriculum.length && pool.length < 60; i++) {
            const summary = curriculum[i];
            if (summary?.id && this.dueLessonIds.has(summary.id)) {
                await addLesson(await window.arborito.lesson.at(i));
            }
        }
        for (let i = 0; i < 48 && pool.length < 48; i++) {
            const lesson = await window.arborito.lesson.next();
            if (!lesson) break;
            await addLesson(lesson);
        }
        if (pool.length < TABLE_SIZE + 1) throw new Error(i18n('NEED_QUIZ'));
        return pool;
    },

    /* Pool rendering: 5 cards face-up. Cards are clickable only during the
     * player's pick phase. Alonso highlights one with `.is-alonso-pick`
     * before drawing it into the battle slot.
     *
     * IMPORTANT: only NEW cards trigger the `cardDealIn` animation. The old
     * implementation wiped innerHTML on every renderTable() call, which made
     * every existing card replay the deal-in animation each turn — players
     * saw cards "appearing twice" and the table flickering.
     */
    renderTable() {
        const pool = this.els.tablePool;
        if (!pool) return;

        const interactive = this.uiMode === 'player-pick' && !this.locked;
        const liveUids = new Set();
        const fragOrder = [];

        this.tableCards.forEach((card, idx) => {
            const uid = card.uid || cardUid(card);
            liveUids.add(uid);
            let btn = this._tableCardEls.get(uid);
            const isNew = !btn;
            if (isNew) {
                btn = this._buildTableCardEl(card, idx);
                this._tableCardEls.set(uid, btn);
            } else {
                this._updateTableCardEl(btn, card, idx);
            }
            btn.disabled = !interactive;
            btn.dataset.idx = String(idx);
            btn.onclick = () => this.onPlayerPickFromTable(idx);
            fragOrder.push(btn);
        });

        for (const [uid, el] of this._tableCardEls) {
            if (!liveUids.has(uid)) {
                el.remove();
                this._tableCardEls.delete(uid);
            }
        }

        let placeholderIdx = 0;
        const existingPlaceholders = [...pool.querySelectorAll('.table-card--empty')];
        const neededPlaceholders = TABLE_SIZE - this.tableCards.length;
        while (existingPlaceholders.length > neededPlaceholders) {
            const node = existingPlaceholders.pop();
            if (node) node.remove();
        }

        const target = [...fragOrder];
        for (let i = 0; i < neededPlaceholders; i++) {
            let ph = existingPlaceholders[placeholderIdx++];
            if (!ph) {
                ph = document.createElement('div');
                ph.className = 'table-card table-card--empty';
                ph.innerHTML = '<div class="table-card-frame is-placeholder" aria-hidden="true"></div>';
            }
            target.push(ph);
        }

        const current = [...pool.children];
        let needsReorder = current.length !== target.length;
        if (!needsReorder) {
            for (let i = 0; i < target.length; i++) {
                if (current[i] !== target[i]) { needsReorder = true; break; }
            }
        }
        if (needsReorder) {
            target.forEach((el) => pool.appendChild(el));
        }
    },

    _buildTableCardEl(card, idx) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.uid = card.uid || cardUid(card);
        this._applyTableCardClasses(btn, card);
        btn.innerHTML = this._renderTableCardInner(card, idx);
        return btn;
    },

    /** Refresh classes / atk / badges in-place — keeps the same DOM node so
     *  the deal-in animation doesn't replay every turn. */
    _updateTableCardEl(btn, card, idx) {
        this._applyTableCardClasses(btn, card);
        btn.innerHTML = this._renderTableCardInner(card, idx);
    },

    _applyTableCardClasses(btn, card) {
        btn.className = 'table-card' + cardModeClass(card.mode);
        if (card.isReview) btn.classList.add('is-review');
        if (card.isCompleteLesson) btn.classList.add('is-master');
        if (card.isFading) btn.classList.add('is-fading');
    },

    _renderTableCardInner(card, idx) {
        const atk = card.atk || cardDamage(card);
        const tags = this.cardBadgesHtml(card);
        const modeBadge = card.modeLabel
            ? `<span class="table-card-mode">${escapeHtml(card.modeLabel)}</span>`
            : '';
        const keyLabel = (idx ?? -1) >= 0 ? idx + 1 : '';
        const keyBadge = keyLabel
            ? `<span class="table-card-key">${keyLabel}</span>`
            : '';
        return `
            <div class="table-card-frame">
                <div class="table-card-art" aria-hidden="true">
                    <span class="table-card-glyph">${escapeHtml(cardGlyph(card.name))}</span>
                </div>
                <div class="table-card-body">
                    <div class="table-card-top">
                        ${modeBadge}
                        ${keyBadge}
                        <span class="table-card-atk">${atk}</span>
                    </div>
                    <p class="table-card-q">${escapeHtml(card.question)}</p>
                    <div class="table-card-tags">${tags}</div>
                </div>
            </div>
        `;
    },

    onPlayerPickFromTable(idx) {
        if (this.uiMode !== 'player-pick' || this.locked) return;
        if (idx < 0 || idx >= this.tableCards.length) return;
        if (this._tablePickResolve) {
            const resolve = this._tablePickResolve;
            this._tablePickResolve = null;
            resolve(idx);
        }
    },

    _bindTableKeys() {
        this._unbindTableKeys();
        this._tableKeyHandler = (e) => {
            const n = parseInt(e.key, 10);
            if (n >= 1 && n <= this.tableCards.length && this.uiMode === 'player-pick' && !this.locked) {
                e.preventDefault();
                this.onPlayerPickFromTable(n - 1);
            }
        };
        window.addEventListener('keydown', this._tableKeyHandler);
    },

    _unbindTableKeys() {
        if (this._tableKeyHandler) window.removeEventListener('keydown', this._tableKeyHandler);
        this._tableKeyHandler = null;
    },

    renderBattleCard(card, { showOpts = false, optsDisabled = false, owner = 'alonso' } = {}) {
        const slot = this.els.battleSlot;
        if (!slot) return;
        if (!card) {
            slot.innerHTML = '';
            slot.classList.remove('has-card', 'is-alonso', 'is-you');
            return;
        }
        slot.classList.add('has-card');
        slot.classList.toggle('is-alonso', owner === 'alonso');
        slot.classList.toggle('is-you', owner === 'you');
        const atk = card.atk || cardDamage(card);
        const sequence = isSequenceMode(card);
        const interaction = buildInteractionHtml(card, { showOpts, optsDisabled, lang });
        const optsWrap = showOpts
            ? (sequence ? interaction : `<div class="opts">${interaction}</div>`)
            : '';
        const tags = this.cardBadgesHtml(card);
        const modeBadge = card.modeLabel
            ? `<span class="play-card-mode-badge">${escapeHtml(card.modeLabel)}</span>`
            : '';
        /* Ordering modes (chips/steps) render their own question inside `seq-hint`,
         * so showing `play-card-q` would duplicate the prompt on screen. We only
         * include the top-level question when the SDK interaction won't repeat it. */
        const questionBlock = (showOpts && sequence)
            ? ''
            : `<p class="play-card-q">${escapeHtml(card.question)}</p>`;
        slot.innerHTML = `
            <div class="play-card${cardModeClass(card.mode)}${owner === 'alonso' ? ' is-foe' : ''}"
                 data-uid="${escapeAttr(card.uid || cardUid(card))}"
                 data-mode="${escapeAttr(card.mode || 'multiple')}">
                <div class="play-card-frame">
                    <div class="play-card-art" aria-hidden="true">
                        <span class="play-card-glyph">${escapeHtml(cardGlyph(card.name))}</span>
                    </div>
                    <div class="play-card-inner">
                        <div class="play-card-header">
                            <div class="play-card-tags">${modeBadge}${tags}</div>
                            <span class="play-card-atk">${atk}</span>
                        </div>
                        ${questionBlock}
                        ${optsWrap}
                    </div>
                </div>
            </div>
        `;
        this.fx.playFlip();
    },

    clearBattleSlot() {
        this.activeCard = null;
        this.renderBattleCard(null);
    },

    /* ---------------------------------------------------------------- */
    /* Block phase: Alonso picked a card; player has BLOCK_TIME_SEC to
     * answer it. Correct/quick answer scores the player; failure or
     * timeout scores Alonso. */
    /* ---------------------------------------------------------------- */
    waitPlayerAnswer(card) {
        return this._waitPlayerAnswer(card);
    },

    async _waitPlayerAnswer(card) {
        const sequence = isSequenceMode(card);
        this.renderBattleCard(card, { showOpts: true, optsDisabled: sequence, owner: 'alonso' });
        this.setPlayerMood('focus');

        if (sequence) {
            const expectedLen = Array.isArray(card.sequence) ? card.sequence.length : 0;
            const readMs = Math.min(
                BLOCK_SEQ_READ_MAX_MS,
                BLOCK_SEQ_READ_BASE_MS + expectedLen * BLOCK_SEQ_READ_PER_ITEM_MS
            );
            await wait(readMs);
            const slot = this.els.battleSlot;
            if (slot) {
                slot.querySelectorAll('.seq-chip, .seq-submit').forEach((b) => { b.disabled = false; });
            }
        }

        this._blockStartTime = Date.now();
        const slot = this.els.battleSlot;
        return new Promise((resolve) => {
            let done = false;
            const finish = (ok, pickedBtn = null, timedOut = false) => {
                if (done) return;
                done = true;
                this.stopBlockTimer();
                const elapsedSec = (Date.now() - this._blockStartTime) / 1000;
                if (isSequenceMode(card)) {
                    slot.querySelectorAll('.seq-chip, .seq-submit').forEach((b) => { b.disabled = true; });
                } else {
                    const buttons = [...slot.querySelectorAll('.opt-btn')];
                    buttons.forEach((b) => {
                        b.disabled = true;
                        if (b.dataset.value === card.correct) b.classList.add('correct');
                        else if (b === pickedBtn && !ok) b.classList.add('wrong');
                    });
                }
                setTimeout(() => resolve({ ok, timedOut, elapsedSec }), 450);
            };
            if (isSequenceMode(card)) {
                const pool = seqPoolEl(slot);
                const target = seqTargetEl(slot);
                const submitBtn = slot.querySelector('.seq-submit');
                const expectedLen = Array.isArray(card.sequence) ? card.sequence.length : 0;

                const submitNow = () => {
                    if (this.locked || done) return;
                    this.locked = true;
                    finish(checkSequenceAnswer(card, seqPickedWords(slot)));
                };

                const moveToTarget = (chip) => {
                    if (!target || !chip || chip.parentElement === target) return;
                    target.appendChild(chip);
                    seqRefreshTargetPlaceholder(target);
                    if (expectedLen > 0 && seqPickedWords(slot).length >= expectedLen) {
                        submitNow();
                    }
                };

                const moveToPool = (chip) => {
                    if (!pool || !chip || chip.parentElement === pool) return;
                    pool.appendChild(chip);
                    seqRefreshTargetPlaceholder(target);
                };

                if (pool) {
                    pool.querySelectorAll('.seq-chip').forEach((chip) => {
                        chip.onclick = () => {
                            if (this.locked || done || chip.disabled) return;
                            moveToTarget(chip);
                        };
                    });
                }
                if (target) {
                    target.onclick = (e) => {
                        const chip = e.target.closest?.('.seq-chip');
                        if (!chip || this.locked || done || chip.disabled) return;
                        moveToPool(chip);
                    };
                }
                if (submitBtn) submitBtn.onclick = submitNow;
                this.startBlockTimer(() => { if (!done) { this.locked = true; finish(false, null, true); } });
                return;
            }
            const buttons = [...slot.querySelectorAll('.opt-btn')];
            buttons.forEach((btn) => {
                btn.onclick = () => {
                    if (this.locked || done) return;
                    this.locked = true;
                    finish(btn.dataset.value === card.correct, btn);
                };
            });
            this._bindBlockKeys(buttons, (btn) => {
                if (this.locked || done) return;
                this.locked = true;
                finish(btn.dataset.value === card.correct, btn);
            });
            this.startBlockTimer(() => { if (!done) { this.locked = true; finish(false, null, true); } });
        });
    },

    startBlockTimer(onTimeout) {
        this.stopBlockTimer();
        if (!this.els.blockTimer) return;
        const card = this.activeCard;
        const totalSec = card ? blockTimeForCard(card) : BLOCK_TIME_SEC;
        this.els.blockTimer.classList.remove('hidden', 'is-urgent');
        let left = totalSec;
        const circumference = 94.25;
        const updateRing = () => {
            const pct = left / totalSec;
            if (this.els.blockTimerFill) this.els.blockTimerFill.style.strokeDashoffset = String(circumference * (1 - pct));
            if (this.els.blockTimerNum) this.els.blockTimerNum.textContent = String(left);
            this.els.blockTimer.classList.toggle('is-urgent', left <= 4);
            if (left <= 4) this.fx.playTick(true);
        };
        updateRing();
        this._blockTimerTick = setInterval(() => {
            left -= 1;
            if (left <= 0) { this.stopBlockTimer(); onTimeout(); return; }
            updateRing();
        }, 1000);
    },

    stopBlockTimer() {
        if (this._blockTimerTick) clearInterval(this._blockTimerTick);
        this._blockTimerTick = null;
        if (this.els.blockTimer) this.els.blockTimer.classList.add('hidden');
        this._unbindBlockKeys();
    },

    _bindBlockKeys(buttons, onPick) {
        this._unbindBlockKeys();
        this._keyHandler = (e) => {
            const n = parseInt(e.key, 10);
            if (n >= 1 && n <= buttons.length) {
                e.preventDefault();
                const btn = buttons[n - 1];
                if (btn && !btn.disabled) onPick(btn);
            }
        };
        window.addEventListener('keydown', this._keyHandler);
    },

    _unbindBlockKeys() {
        if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
        this._keyHandler = null;
    },

    alonsoDefenseAccuracy() {
        const ramp = Math.min(0.12, this.round * 0.008);
        return Math.min(0.55, ALONSO_DEFENSE_BASE + ramp);
    },

    /* Attack phase: Player picked a card; Alonso animates an answer. */
    async animateAlonsoAnswer(card) {
        this.setPhase(i18n('PHASE_PLAYER_ATTACK'), 'you');
        this.setTableHint('TABLE_HINT_ATTACK');
        this.setAlonsoMood('thinking');
        this.setAlonsoTaunt('TAUNTS_THINK');
        this.renderBattleCard(card, { showOpts: true, optsDisabled: true, owner: 'you' });
        await wait(PAUSE_THINK);

        let alonsoCorrect = Math.random() < this.alonsoDefenseAccuracy();
        const slot = this.els.battleSlot;

        if (isSequenceMode(card)) {
            const pool = seqPoolEl(slot);
            const target = seqTargetEl(slot);
            const sequence = Array.isArray(card.sequence) ? card.sequence : [];
            const allChips = (Array.isArray(card.chips) && card.chips.length)
                ? card.chips
                : sequence;
            let pickOrder = alonsoCorrect ? [...sequence] : shuffle([...sequence]);
            /* Make sure a "wrong" roll *visibly* misses. Reversing only helps when
             * the sequence has at least 2 elements; for length 1 (or shuffles that
             * happen to land on the right answer) we try to swap in a chip that
             * isn't the correct one, and as a last resort we sync the boolean
             * with what the animation actually shows. */
            if (!alonsoCorrect && checkSequenceAnswer(card, pickOrder)) {
                if (pickOrder.length >= 2) {
                    pickOrder.reverse();
                }
                if (checkSequenceAnswer(card, pickOrder)) {
                    const correct = sequence[0];
                    const decoys = allChips.filter((c) => c !== correct);
                    if (decoys.length) {
                        pickOrder = [decoys[Math.floor(Math.random() * decoys.length)]];
                    } else {
                        alonsoCorrect = true;
                    }
                }
            }
            const answerLine = i18n('ALONSO_PICKS', { ans: pickOrder.join(' → ') });
            const speechHold = PAUSE_THINK
                + pickOrder.length * ALONSO_SEQ_CHIP_MS
                + ALONSO_SEQ_TAIL_MS
                + PAUSE_RESULT
                + 500;
            this.showAlonsoSpeech(answerLine, { holdMs: speechHold });
            const usedIdx = new Set();
            for (const word of pickOrder) {
                const chip = seqTakeChipFromPool(pool, word, usedIdx);
                if (!chip) continue;
                chip.classList.add('alonso-pick');
                if (target) target.appendChild(chip);
                seqRefreshTargetPlaceholder(target);
                await wait(ALONSO_SEQ_CHIP_MS);
                chip.classList.remove('alonso-pick');
            }
            await wait(ALONSO_SEQ_TAIL_MS);
            slot.querySelectorAll('.seq-chip.alonso-pick').forEach((c) => c.classList.remove('alonso-pick'));
            await wait(PAUSE_RESULT);
            return alonsoCorrect;
        }

        const buttons = [...slot.querySelectorAll('.opt-btn')];
        const wrongOpts = (card.options || []).filter((o) => o !== card.correct);
        let pick;
        if (alonsoCorrect) {
            pick = card.correct;
        } else if (wrongOpts.length) {
            pick = wrongOpts[Math.floor(Math.random() * wrongOpts.length)];
        } else {
            /* No wrong option available (degenerate card with a single answer):
             * fall back to the correct one and align the boolean so the result
             * matches what the player actually sees Alonso pick. */
            pick = card.correct;
            alonsoCorrect = true;
        }
        const answerLine = i18n('ALONSO_PICKS', { ans: pick });
        this.showAlonsoSpeech(answerLine, { holdMs: PAUSE_REVEAL + PAUSE_RESULT + 400 });
        buttons.forEach((b) => { if (b.dataset.value === pick) b.classList.add('alonso-pick'); });
        await wait(PAUSE_REVEAL);
        buttons.forEach((b) => {
            b.classList.remove('alonso-pick');
            if (b.dataset.value === card.correct) b.classList.add('correct');
            else if (b.dataset.value === pick && pick !== card.correct) b.classList.add('wrong');
        });
        await wait(PAUSE_RESULT);
        return pick === card.correct;
    },

    /* Pool helpers ----------------------------------------------------- */
    refillTable() {
        while (this.tableCards.length < TABLE_SIZE && this.drawPile.length) {
            this.tableCards.push(this.drawPile.pop());
        }
        this.renderTable();
        this._updateDeckRemaining();
    },

    _alonsoChooseTableIndex() {
        if (!this.tableCards.length) return -1;
        /* Card damage typically sits in 12–28. The previous ±3 jitter was so
         * small that Alonso almost always picked the single highest-atk card —
         * matches felt deterministic. A wider jitter (~±8) plus a small bias
         * toward review cards keeps strategy without making the AI a slot. */
        let bestIdx = 0;
        let bestScore = -Infinity;
        this.tableCards.forEach((card, i) => {
            let score = card.atk || cardDamage(card);
            if (card.isReview) score += 5;
            if (card.isCompleteLesson) score += 2;
            score += (Math.random() - 0.5) * 16;
            if (score > bestScore) { bestScore = score; bestIdx = i; }
        });
        return bestIdx;
    },

    /* Alonso's turn: he picks one of the 5 face-up cards and the player
     * has to answer it. */
    async alonsoTurn() {
        if (!this.tableCards.length) return;
        this.uiMode = 'alonso-pick';
        this._unbindTableKeys();
        this.setPhase(i18n('PHASE_ALONSO_PICKS'), 'alonso');
        this.setTableHint('TABLE_HINT_ALONSO');
        this.setAlonsoMood('thinking');
        this.setAlonsoTaunt('TAUNTS_THINK');
        const idx = this._alonsoChooseTableIndex();
        this.renderTable();
        const cards = [...this.els.tablePool.querySelectorAll('.table-card')];
        const target = cards[idx];
        if (target) target.classList.add('is-alonso-pick');
        await wait(PAUSE_THINK);
        const card = this.tableCards.splice(idx, 1)[0];
        this._toDiscard();
        this.activeCard = card;
        this.renderTable();
        this.announce(i18n('BANNER_ALONSO_PICKS', { name: card.name }), { tone: 'foe', icon: '⚔', key: 'turn' });
        this.setAlonsoMood('smug');
        if (isSequenceMode(card)) {
            await wait(Math.min(PAUSE_READ, 750 + (card.sequence?.length || 2) * 90));
        } else {
            await wait(PAUSE_SHORT);
        }

        this.setPhase(i18n('PHASE_BLOCK'), 'you');
        this.setTableHint('TABLE_HINT_BLOCK');
        this.announce(i18n('BANNER_BLOCK'), { tone: 'you', icon: '🛡', key: 'turn' });
        this.locked = false;
        const result = await this.waitPlayerAnswer(card);
        this.locked = true;
        this.setPlayerMood('idle');

        const dmg = card.atk || cardDamage(card);
        if (result.timedOut) {
            if (this._consumeShield()) {
                this.setLog(i18n('BANNER_SHIELD_ABSORB'));
                this.announce(i18n('BANNER_SHIELD_ABSORB'), { tone: 'shield', icon: '🛡', key: 'result' });
                this.blockStreak = 0;
                this.fx.playBlock();
            } else {
                this.scoreSide('alonso', WHIFF_DAMAGE, { shake: true });
                this.setLog(i18n('YOU_BLOCK_TIMEOUT', { n: WHIFF_DAMAGE }));
                this.announce(i18n('BANNER_HIT_YOU', { n: WHIFF_DAMAGE }), { tone: 'foe', icon: '💥', key: 'result' });
                this.blockStreak = 0;
                this.setAlonsoMood('smug');
                this.sparkBurst('you', '#fb923c');
                this.fx.playHit();
                this.setAlonsoTaunt('TAUNTS_HIT_YOU');
            }
        } else if (result.ok) {
            const perfect = result.elapsedSec <= PERFECT_BLOCK_SEC;
            const reward = perfect ? PERFECT_BLOCK_BONUS + BLOCK_BONUS : BLOCK_BONUS;
            this.scoreSide('you', reward);
            this.setLog(perfect
                ? i18n('BANNER_PERFECT_BLOCK', { n: reward })
                : i18n('YOU_BLOCK_OK', { n: reward }));
            this.announce(perfect
                ? i18n('BANNER_PERFECT_BLOCK', { n: reward })
                : i18n('BANNER_BLOCK_OK'), { tone: perfect ? 'crit' : 'you', icon: perfect ? '✨' : '🛡', key: 'result' });
            this.blockStreak += 1;
            this.attackStreak = 0;
            this._gainSpecial(SPECIAL_GAIN_BLOCK);
            this._maybeGrantShield();
            this.setAlonsoMood('hurt');
            this.sparkBurst('alonso', '#6ee7b7');
            this.fx.playBlock();
            if (this.blockStreak >= 2) this.fx.playCombo(this.blockStreak);
            this.setAlonsoTaunt('TAUNTS_BLOCKED');
            this.setPlayerMood('happy');
            this._reportCardMemory(card, 4);
        } else {
            if (this._consumeShield()) {
                this.setLog(i18n('BANNER_SHIELD_ABSORB'));
                this.announce(i18n('BANNER_SHIELD_ABSORB'), { tone: 'shield', icon: '🛡', key: 'result' });
                this.blockStreak = 0;
                this.fx.playBlock();
                this.setAlonsoTaunt('TAUNTS_BLOCKED');
            } else {
                this.scoreSide('alonso', dmg, { shake: true });
                this.setLog(i18n('YOU_BLOCK_FAIL', { n: dmg }));
                this.announce(i18n('BANNER_HIT_YOU', { n: dmg }), { tone: 'foe', icon: '💥', key: 'result' });
                this.blockStreak = 0;
                this.setAlonsoMood('smug');
                this.sparkBurst('you', '#fb923c');
                this.fx.playHit();
                this.setAlonsoTaunt('TAUNTS_HIT_YOU');
                this.setPlayerMood('hurt');
            }
        }
        await wait(PAUSE_RESULT);
        this.setAlonsoMood('idle');
        this.setPlayerMood('idle');
        this.clearBattleSlot();
    },

    _reportCardMemory(card, quality) {
        if (card?.lessonId && (card.isReview || card.isFading) && window.arborito?.memory?.report) {
            try { window.arborito.memory.report(card.lessonId, quality); } catch (_) {}
        }
    },

    /* Player's turn: 5 cards on the table become clickable. The player
     * picks one and Alonso has to answer it. */
    async playerTurn() {
        if (!this.tableCards.length) return;
        this.uiMode = 'player-pick';
        this.locked = false;
        this.setPhase(i18n('PHASE_PLAYER_PICKS'), 'you');
        this.setTableHint('TABLE_HINT_PLAYER');
        this.announce(i18n('BANNER_YOUR_TURN'), { tone: 'you', icon: '⚔', key: 'turn' });
        this.renderTable();
        this._bindTableKeys();
        this._updateSpecialMeter();

        const idx = await new Promise((resolve) => { this._tablePickResolve = resolve; });
        this._unbindTableKeys();
        this.locked = true;
        if (idx < 0 || idx >= this.tableCards.length) return;
        const card = this.tableCards.splice(idx, 1)[0];
        this._toDiscard();
        this.activeCard = card;
        this.renderTable();
        this.setPlayerMood('focus');

        const useCrit = this.critReady;
        let dmg = card.atk || cardDamage(card);
        dmg += this.comboBonus();
        if (useCrit) { dmg = Math.round(dmg * CRIT_MULT); this._spendSpecial(); }

        const alonsoOk = await this.animateAlonsoAnswer(card);

        if (!alonsoOk) {
            this.scoreSide('you', dmg, { shake: true, crit: useCrit });
            this.setLog(useCrit ? i18n('YOU_ATTACK_CRIT', { n: dmg }) : i18n('YOU_ATTACK_OK', { n: dmg }));
            this.announce(
                useCrit ? i18n('BANNER_CRIT', { n: dmg }) : i18n('BANNER_HIT_ALONSO', { n: dmg }),
                { tone: useCrit ? 'crit' : 'you', icon: useCrit ? '⚡' : '🎯', key: 'result' }
            );
            this.attackStreak += 1;
            this.blockStreak = 0;
            this._gainSpecial(SPECIAL_GAIN_ATTACK);
            this.setAlonsoMood('hurt');
            this.sparkBurst('alonso', useCrit ? '#fde047' : '#6ee7b7');
            this.fx.playAttack();
            if (this.attackStreak >= 2) {
                this.fx.playCombo(this.attackStreak);
                this.announce(i18n('BANNER_COMBO', { n: this.attackStreak }), { tone: 'crit', icon: '🔥', key: 'combo' });
            }
            this.setAlonsoTaunt('TAUNTS_HIT_ALONSO');
            this.setPlayerMood('happy');
            this._reportCardMemory(card, 4);
        } else {
            const chip = BLOCK_CHIP;
            this.scoreSide('alonso', chip);
            this.setLog(i18n('YOU_ATTACK_FAIL', { n: chip }));
            this.announce(i18n('BANNER_HIT_YOU', { n: chip }), { tone: 'foe', icon: '🛡', key: 'result' });
            this.attackStreak = 0;
            this.setAlonsoMood('smug');
            this.sparkBurst('you', '#fb923c');
            this.fx.playBlock();
            this.setAlonsoTaunt('TAUNTS_DODGED');
            this.setPlayerMood('hurt');
        }
        await wait(PAUSE_RESULT);
        this.setAlonsoMood('idle');
        this.setPlayerMood('idle');
        this.clearBattleSlot();
    },

    checkWin() {
        if (this.you >= WIN_POINTS) return 'you';
        if (this.alonso >= WIN_POINTS) return 'alonso';
        return null;
    },

    endMatch(winner) {
        const won = winner === 'you';
        this.els.endTitle.textContent = won ? i18n('YOU_WIN') : i18n('ALONSO_WIN');
        this.els.endScores.textContent = `${i18n('PTS')}: ${this.you} — Alonso: ${this.alonso}`;
        this.els.endEmoji.textContent = won ? '🏆' : '💀';
        this.setAlonsoMood(won ? 'hurt' : 'victorious');
        this.setPlayerMood(won ? 'victory' : 'hurt');
        let xp = won ? 40 : 8;
        if (won && this.dueLessonIds.size) xp += 15;
        if (won) { this.stats.wins += 1; this.fx.playVictory(); }
        else { this.stats.losses += 1; this.fx.playDefeat(); }
        const best = Math.max(this.blockStreak, this.attackStreak, this.stats.bestCombo || 0);
        this.stats.bestCombo = Math.max(this.stats.bestCombo || 0, best);
        saveStats(this.stats);
        this.els.endBonus.textContent = won && this.dueLessonIds.size
            ? i18n('END_BONUS', { n: xp })
            : i18n('END_BONUS_XP', { n: xp });
        this.els.endOverlay.classList.remove('hidden');
        if (window.arborito?.xp) window.arborito.xp(xp);
        /* `memory` may exist without `report` on older bridges; guard the call so
         * the post-game summary never throws when the SRS API is partial. */
        if (this.primaryLessonId && window.arborito?.memory?.report) {
            try { window.arborito.memory.report(this.primaryLessonId, won ? 4 : 2); } catch (_) {}
        }
    },

    async start() {
        await this.fx.initAudio();
        this.els.btnStart.disabled = true;
        this.els.loadingText.classList.remove('hidden');
        this.els.loadingText.textContent = i18n('LOADING');
        try {
            /* Rematch hygiene: clear cross-game state BEFORE loading the new pool
             * so `loadPool` starts from a clean slate. Without this, `primaryLessonId`
             * would stick from the first game and `endMatch.memory.report` would
             * keep reporting against the wrong lesson on every rematch. */
            this.lessonIds = new Set();
            this.primaryLessonId = null;
            this.locked = false;
            this.uiMode = 'idle';
            this.activeCard = null;
            this.pool = await this.loadPool();
            this.you = 0;
            this.alonso = 0;
            this.round = 0;
            this.blockStreak = 0;
            this.attackStreak = 0;
            this.specialMeter = 0;
            this.critReady = false;
            this.shieldActive = false;
            this.discardCount = 0;
            this.tableCards = [];
            this.drawPile = shuffle(this.pool);
            for (let i = 0; i < TABLE_SIZE && this.drawPile.length; i++) {
                this.tableCards.push(this.drawPile.pop());
            }
            if (this.els.tablePool) this.els.tablePool.innerHTML = '';
            this._tableCardEls = new Map();
            this.clearAlonsoSpeech();
            this.setLog('');
            this.els.startOverlay.classList.add('hidden');
            this.els.app.classList.remove('hidden');
            this.els.endOverlay.classList.add('hidden');
            this._updateSpecialMeter();
            this._updateShieldBadge();
            this._updateReviewDueChip();
            this._updateDeckRemaining();
            this.updateHp();
            this.clearBattleSlot();
            this.renderTable();
            await this.gameLoop();
        } catch (e) {
            this.els.loadingText.textContent = e.message || String(e);
            this.els.btnStart.disabled = false;
        }
    },

    reset() {
        this.stopBlockTimer();
        this._unbindTableKeys();
        /* Release any pending pick promise so an in-flight `playerTurn` can
         * unwind cleanly when the player triggers a rematch mid-game (e.g.
         * by hitting the rematch button after a win that happened during
         * Alonso's animation). Without this the awaited promise would never
         * resolve and the previous `gameLoop` would leak forever. */
        if (this._tablePickResolve) {
            const resolve = this._tablePickResolve;
            this._tablePickResolve = null;
            try { resolve(-1); } catch (_) {}
        }
        this.clearAlonsoSpeech();
        this.setLog('');
        if (this.els.tablePool) this.els.tablePool.innerHTML = '';
        this._tableCardEls = new Map();
        this.locked = false;
        this.uiMode = 'idle';
        this.els.endOverlay.classList.add('hidden');
        this.els.app.classList.add('hidden');
        this.els.startOverlay.classList.remove('hidden');
        this.els.loadingText.classList.add('hidden');
        this.els.btnStart.disabled = false;
        this.clearBattleSlot();
        this._bindStaticUi();
    },

    async gameLoop() {
        while (true) {
            let w = this.checkWin();
            if (w) return this.endMatch(w);
            this.round += 1;
            this._updateRoundBadge();
            this.refillTable();
            if (!this.tableCards.length) return this.endMatch(this.you >= this.alonso ? 'you' : 'alonso');

            await this.alonsoTurn();
            w = this.checkWin();
            if (w) return this.endMatch(w);
            this.refillTable();
            if (!this.tableCards.length) return this.endMatch(this.you >= this.alonso ? 'you' : 'alonso');

            await this.playerTurn();
            w = this.checkWin();
            if (w) return this.endMatch(w);
            this.refillTable();
            await wait(PAUSE_SHORT);
        }
    }
});

new AlonsoDuel();
