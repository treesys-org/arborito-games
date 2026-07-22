/** Static mode uses lesson questionnaires only, no on-device AI. */
export function isStaticMode() {
 return !!(window.arborito && typeof window.arborito.getAIMode === 'function' && window.arborito.getAIMode() === 'static');
}

export function answersMatch(playerAnswer, expected) {
 const api = quizApi();
 if (api && typeof api.answersMatch === 'function') {
 return api.answersMatch(playerAnswer, expected);
 }
 const cleanPlayer = String(playerAnswer || '').trim().toLowerCase();
 const cleanCorrect = String(expected || '').trim().toLowerCase();
 if (!cleanPlayer || !cleanCorrect) return false;
 return cleanPlayer === cleanCorrect;
}

export async function resolveLessonById(lessonId) {
 const arb = window.arborito;
 if (!arb?.lesson || !lessonId) return null;
 try {
 if (typeof arb.lesson.byId === 'function') return await arb.lesson.byId(lessonId);
 } catch (_) {}
 return null;
}

export async function gradeQuizAnswer(lesson, item, playerText) {
 const api = quizApi();
 if (api && typeof api.gradeAnswer === 'function' && lesson) {
 return api.gradeAnswer(lesson, item, playerText);
 }
 return answersMatch(playerText, item?.correct);
}

function quizApi() {
 return window.arborito && window.arborito.quiz;
}

function isJunkOption(label) {
 const t = String(label || '').trim();
 if (!t) return true;
 return (
 t === ':' ||
 t === ': ' ||
 t === '\u2014' ||
 t === '-' ||
 t === '–' ||
 t === '…' ||
 t === '...' ||
 t === '___' ||
 t === '______' ||
 t === 'N/A' ||
 t === 'Unknown'
);
}

/**
 * @param {object} concept
 * @param {{ distractorPool?: string[], lang?: string }} [opts]
 */
export function buildOptions(concept, opts = {}) {
 const api = quizApi();
 const pool = Array.isArray(opts.distractorPool) ? opts.distractorPool : [];
 const lang = opts.lang || window.arborito?.user?.lang || 'EN';
 if (api && typeof api.buildOptions === 'function') {
 return api.buildOptions(concept, { count: 4, distractorPool: pool, lang });
 }
 const correct = String(concept.correct || '').trim();
 if (!correct) return [];
 const seen = new Set([correct.toLowerCase()]);
 const out = [correct];
 const raw = [concept.wrong, ...(concept.traps || []), ...(concept.options || []), ...pool];
 for (const r of raw) {
 const label = String(r || '').trim();
 if (isJunkOption(label)) continue;
 const key = label.toLowerCase();
 if (seen.has(key)) continue;
 seen.add(key);
 out.push(label);
 if (out.length >= 4) break;
 }
 let padN = 1;
 while (out.length < 2 && padN <= 12) {
 const pad = String(lang).toUpperCase() === 'ES' ? `Incorrecto ${padN}` : `Wrong ${padN}`;
 padN += 1;
 if (seen.has(pad.toLowerCase())) continue;
 seen.add(pad.toLowerCase());
 out.push(pad);
 }
 return out;
}

export async function loadQuizPool(roundCount = 6) {
 const api = quizApi();
 if (!api || typeof api.pool !== 'function') return [];
 const pool = await api.pool({ count: roundCount });
 return pool.map((item) => ({
 ...item,
 concept: item.topic || '',
 complaint: buildComplaint(item, {})
 }));
}

function buildComplaint(item, challenge) {
 const topic = item.topic || challenge.core_concept || 'system';
 const q = item.q || challenge.main_question || '';
 if (q.length > 20) return q;
 return `Critical failure in ${topic}: ${q}`;
}

export function pickRandom(pool) {
 if (!pool || pool.length === 0) return null;
 return pool[Math.floor(Math.random() * pool.length)];
}

export function quizItemKey(item) {
 const api = quizApi();
 if (api && typeof api.itemKey === 'function') return api.itemKey(item);
 if (!item) return '';
 return `${item.lessonId || item.topic || ''}::${item.q || item.complaint || ''}`.toLowerCase();
}

/** Pick a pool item not used this session; resets when the pool is exhausted. */
export function pickUnusedFromPool(pool, usedKeys) {
 const api = quizApi();
 if (api && typeof api.pick === 'function') {
 return api.pick(pool, usedKeys);
 }
 return pickRandom(pool);
}

export function reportMemory(lessonId, quality) {
 if (!window.arborito || typeof window.arborito.memory?.report !== 'function' || !lessonId) return;
 try { window.arborito.memory.report(lessonId, quality); } catch (e) {}
}

export function grantXp(amount) {
 if (!window.arborito || typeof window.arborito.xp !== 'function') return;
 try { window.arborito.xp(amount); } catch (e) {}
}
