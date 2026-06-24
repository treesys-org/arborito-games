/** Static mode uses lesson questionnaires only — no on-device AI. */
export function isStaticMode() {
    return !!(window.arborito && typeof window.arborito.getAIMode === 'function' && window.arborito.getAIMode() === 'static');
}

export function answersMatch(playerAnswer, expected) {
    const cleanPlayer = String(playerAnswer || '').trim().toLowerCase();
    const cleanCorrect = String(expected || '').trim().toLowerCase();
    if (!cleanPlayer || !cleanCorrect) return false;
    return cleanPlayer === cleanCorrect
        || cleanPlayer.includes(cleanCorrect)
        || cleanCorrect.includes(cleanPlayer);
}

export function buildOptions(concept) {
    const raw = [
        concept.correct,
        concept.wrong,
        ...(Array.isArray(concept.options) ? concept.options : []),
        ...(Array.isArray(concept.traps) ? concept.traps : [])
    ];
    const seen = new Set();
    const unique = [];
    raw.forEach((opt) => {
        const label = String(opt || '').trim();
        if (!label) return;
        const key = label.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(label);
    });
    const fallbacks = [
        concept.wrong,
        ...(Array.isArray(concept.traps) ? concept.traps : []),
        'N/A',
        'Unknown'
    ].filter(Boolean);
    while (unique.length < 4 && fallbacks.length) {
        const next = String(fallbacks.shift()).trim();
        const key = next.toLowerCase();
        if (next && !seen.has(key)) {
            seen.add(key);
            unique.push(next);
        }
    }
    for (let i = unique.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    return unique.length >= 2 ? unique.slice(0, 4) : [concept.correct, concept.wrong].filter(Boolean);
}

export async function loadQuizPool(roundCount = 6) {
    const pool = [];
    const seen = new Set();
    if (!window.arborito || typeof window.arborito.lesson?.next !== 'function' || typeof window.arborito.quiz !== 'function') {
        return pool;
    }
    for (let i = 0; i < roundCount; i++) {
        let lesson;
        try { lesson = await window.arborito.lesson.next(); } catch (e) { break; }
        if (!lesson) break;
        if (seen.has(lesson.id)) break;
        seen.add(lesson.id);
        let batch;
        try { batch = await window.arborito.quiz(lesson, { count: 1 }); } catch (e) { continue; }
        if (!batch || !batch[0]) continue;
        const item = batch[0];
        const challenge = lesson.challenge || {};
        const trapOptions = Array.isArray(challenge.traps) ? challenge.traps : [];
        pool.push({
            topic: item.topic || lesson.title || '?',
            q: item.q,
            correct: item.correct,
            wrong: item.wrong,
            traps: trapOptions,
            options: trapOptions,
            lessonId: lesson.id,
            concept: challenge.core_concept || item.topic || '',
            complaint: buildComplaint(item, challenge)
        });
    }
    return pool;
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

export function reportMemory(lessonId, quality) {
    if (!window.arborito || typeof window.arborito.memory?.report !== 'function' || !lessonId) return;
    try { window.arborito.memory.report(lessonId, quality); } catch (e) {}
}

export function grantXp(amount) {
    if (!window.arborito || typeof window.arborito.xp !== 'function') return;
    try { window.arborito.xp(amount); } catch (e) {}
}
