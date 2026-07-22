/**
 * Alonso Duel, duel-specific deck adapter.
 *
 * Wraps `window.arborito.challenge.modes.*` (the universal Quiz V2 engine
 * exposed by the platform SDK) and decorates every base card with combat
 * stats, power, themed names, mode label, that only make sense inside
 * the duel. Generic Quiz V2 helpers (renderAnswers, className, isOrdering,
 * checkOrder, mode-label translations) live in the SDK; this file does not
 * reimplement them.
 */

export const MODE_MULTIPLE = 'multiple';

/* Combat damage per modality. Higher = harder for the opponent to block. */
const MODE_POWER = {
 multiple: 100,
 recall: 96,
 cloze: 92,
 chips: 108,
 steps: 112
};

/* Card name prefixes shown above the question. Themed for the duel; other
 * cartridges that surface Quiz V2 cards should pick their own copy. */
const NAME_PREFIX = {
 EN: { recall: 'Recall', cloze: 'Cloze', chips: 'Order', steps: 'Steps' },
 ES: { recall: 'Recuerda', cloze: 'Hueco', chips: 'Orden', steps: 'Pasos' }
};

function modesApi() {
 return (window.arborito && window.arborito.challenge && window.arborito.challenge.modes) || null;
}

function decorateBaseCard(baseCard, lessonTitle, lang) {
 const concept = baseCard.concept || lessonTitle || (lang === 'EN' ? 'Concept' : 'Concepto');
 const prefixes = NAME_PREFIX[lang] || NAME_PREFIX.ES;
 const prefix = prefixes[baseCard.mode];
 const name = baseCard.mode === MODE_MULTIPLE
 ? concept
 : (prefix ? `${prefix}: ${concept}` : concept);
 const label = (modesApi()?.label?.(baseCard.mode, lang)) || baseCard.mode;
 return {
 ...baseCard,
 id: baseCard.mode,
 name,
 effect: baseCard.clozeDisplay || '',
 power: MODE_POWER[baseCard.mode] || 100,
 modeLabel: label
 };
}

/** Build duel hand cards for a challenge: one card per playable Quiz V2 mode. */
export function buildCardsFromChallenge(challenge, lessonTitle, lang = 'ES', opts = {}) {
 const api = modesApi();
 if (!api || !challenge) return [];
 const modes = api.playable(challenge);
 const cards = [];
 const cardOpts = {
 lessonTitle,
 lang,
 distractorPool: Array.isArray(opts.distractorPool) ? opts.distractorPool : undefined
 };
 for (const mode of modes) {
 const base = api.buildCard(challenge, mode, cardOpts);
 if (base) cards.push(decorateBaseCard(base, lessonTitle, lang));
 }
 return cards;
}
