import { SpriteGen, Colors } from './assets.js';

/* Platform helpers come from the SDK (window.arborito.platform.*).
 * Aliased so the rest of the file keeps its existing names. */
const _platform = (window.arborito && window.arborito.platform) || {};
const bindMobileTap = _platform.onTap || (() => () => {});
const initViewportListeners = _platform.onScreenChange || (() => () => {});

const translations = {
    EN: {
        START_CLASS: "START CLASS",
        START_DESC: "Evaluate your classmates.\nWrite your answers.\nWin the ranking.",
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
        SUBMIT: "SUBMIT",
        JUDGE_CORRECT: "✅ CORRECT",
        JUDGE_WRONG: "❌ WRONG",
        UNKNOWN_SPEAKER: "???",
        NEXT_BTN: "NEXT ▶",
        CHOOSE_OPTION: "Choose an answer:",
        RULES_TITLE: "CLASS SYLLABUS",
        RULE_1: "JUDGE your classmates (Correct vs Incorrect).",
        RULE_2: "TYPE the answer when the Teacher asks YOU.",
        RULE_3: "SCORE points to top the ranking.",
        BTN_READY: "I UNDERSTAND"
    },
    ES: {
        START_CLASS: "EMPEZAR CLASE",
        START_DESC: "Evalúa a tus compañeros.\nEscribe tus respuestas.\nGana el ranking.",
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
        SUBMIT: "ENVIAR",
        JUDGE_CORRECT: "✅ CORRECTO",
        JUDGE_WRONG: "❌ INCORRECTO",
        UNKNOWN_SPEAKER: "???",
        NEXT_BTN: "SIGUIENTE ▶",
        CHOOSE_OPTION: "Elige una respuesta:",
        RULES_TITLE: "SILABARIO DE CLASE",
        RULE_1: "JUZGA a tus compañeros (Correcto vs Incorrecto).",
        RULE_2: "ESCRIBE la respuesta cuando el Profesor te pregunte.",
        RULE_3: "GANA puntos para liderar el ranking.",
        BTN_READY: "ENTENDIDO"
    }
};

const lang = (window.arborito && window.arborito.user && translations[window.arborito.user.lang.toUpperCase()]) ? window.arborito.user.lang.toUpperCase() : 'EN';
document.getElementById('btn-start').textContent = translations[lang].START_CLASS;
document.getElementById('start-desc').innerHTML = translations[lang].START_DESC.replace(/\n/g, '<br>');

document.getElementById('rules-title').textContent = translations[lang].RULES_TITLE;
document.getElementById('rule-1').textContent = translations[lang].RULE_1;
document.getElementById('rule-2').textContent = translations[lang].RULE_2;
document.getElementById('rule-3').textContent = translations[lang].RULE_3;
document.getElementById('btn-ready').textContent = translations[lang].BTN_READY;

/** Desk index that maps to the human-controlled student sprite. */
const PLAYER_STUDENT_INDEX = 2;

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
            choicePrompt: document.getElementById('choice-prompt')
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
        const wrongPool = (Array.isArray(concept.options) ? concept.options : [])
            .map((v) => String(v || '').trim())
            .filter(Boolean)
            .filter((v) => v.toLowerCase() !== correct.toLowerCase());
        const fallbackWrong = String(concept.wrong || '').trim() || wrongPool[0] || 'No lo sé.';
        if (isRight) return correct || fallbackWrong;
        if (wrongPool.length > 1) {
            return wrongPool[Math.floor(Math.random() * wrongPool.length)];
        }
        return fallbackWrong;
    }

    buildPlayerOptions(concept) {
        // Always present at most 4 options: 1 correct + up to 3 wrong (shuffled).
        const MAX_WRONG = 3;
        const correct = String(concept.correct || '').trim();
        if (!correct) return [];

        const seen = new Set([correct.toLowerCase()]);
        const wrongs = [];
        const wrongPool = [
            concept.wrong,
            ...(Array.isArray(concept.options) ? concept.options : [])
        ];
        wrongPool.forEach((opt) => {
            const label = String(opt || '').trim();
            if (!label) return;
            const key = label.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            wrongs.push(label);
        });

        // Shuffle then trim wrong pool to MAX_WRONG.
        for (let i = wrongs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [wrongs[i], wrongs[j]] = [wrongs[j], wrongs[i]];
        }
        const picked = wrongs.slice(0, MAX_WRONG);

        // Combine and shuffle so the correct one isn't always first.
        const final = [correct, ...picked];
        for (let i = final.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [final[i], final[j]] = [final[j], final[i]];
        }
        return final;
    }

    answersMatch(playerAnswer, expected) {
        const cleanPlayer = String(playerAnswer || '').trim().toLowerCase();
        const cleanCorrect = String(expected || '').trim().toLowerCase();
        if (!cleanPlayer || !cleanCorrect) return false;
        return cleanPlayer === cleanCorrect
            || cleanPlayer.includes(cleanCorrect)
            || cleanCorrect.includes(cleanPlayer);
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
            if (e.key === ' ' || e.key === 'Enter') {
                if (this.state === 'INPUT_TEXT') {
                    this.submitText();
                    return;
                }
                if (this.skipTypingCallback || this.advanceCallback) {
                    e.preventDefault();
                    this.advanceDialogue();
                }
            }
        });

        // Plain click handler — works on mobile + desktop, no preventDefault tricks.
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
    }

    resolveInput(val) {
        if (this.state === 'INPUT' && this.inputResolver) {
            this.inputResolver(val);
            this.ui.overlay.style.display = 'none';
        }
    }

    submitText() {
        if (this.state === 'INPUT_TEXT' && this.textResolver) {
            const val = this.ui.inputField.value.trim();
            if (val.length === 0) return;
            this.textResolver(val);
            this.ui.textOverlay.style.display = 'none';
            this.ui.inputField.value = '';
            this.ui.inputField.blur();
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

    drawBoardContent(ctx) {
        const topicX = 180;
        const statusX = 500;
        const maxTopicW = statusX - topicX - 28;
        ctx.font = '20px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = Colors.term_green;
        ctx.fillText(this.getLine('TOPICS'), topicX, 85);
        if (!this.lessonData.concepts) return;
        let y = 120;
        this.lessonData.concepts.forEach((c, i) => {
            const label = `- ${c.topic || '?'}`;
            ctx.fillStyle = (i === this.currentRound) ? '#fbbf24' : '#fff';
            let drawLabel = label;
            while (ctx.measureText(drawLabel).width > maxTopicW && drawLabel.length > 4) {
                drawLabel = drawLabel.slice(0, -2);
            }
            if (drawLabel !== label) drawLabel = drawLabel.slice(0, -1) + '…';
            ctx.fillText(drawLabel, topicX, y);
            ctx.textAlign = 'center';
            if (c.status === 'correct') {
                ctx.fillStyle = '#4ade80';
                ctx.fillText('✔', statusX, y);
            } else if (c.status === 'wrong') {
                ctx.fillStyle = '#ef4444';
                ctx.fillText('✘', statusX, y);
            } else {
                ctx.fillStyle = '#64748b';
                ctx.fillText('·', statusX, y);
            }
            ctx.textAlign = 'left';
            y += 35;
        });
    }

    async loadClassConcepts(roundCount = 3) {
        /* Walk the playlist silently: lessons without a playable questionnaire are
           skipped without telling the student to "add questions" (they're not the
           author). We stop early as soon as we have `roundCount` usable concepts,
           or after a generous attempt budget so we never spin forever in dynamic mode
           where each quiz() call hits the on-device model. */
        const concepts = [];
        const seen = new Set();
        const MAX_ATTEMPTS = Math.max(roundCount * 3, 12);

        for (let i = 0; i < MAX_ATTEMPTS && concepts.length < roundCount; i++) {
            let lesson = null;
            try {
                lesson = await window.arborito.lesson.next();
            } catch (e) {
                // Source temporarily unreadable — try the next playlist entry.
                continue;
            }
            if (!lesson) break;
            if (seen.has(lesson.id)) break;
            seen.add(lesson.id);

            let batch = null;
            try {
                batch = await window.arborito.quiz(lesson, { count: 1 });
            } catch (e) {
                // Empty Quiz V2 / AI error: silently skip — student keeps playing.
                continue;
            }
            if (!batch || !batch[0]) continue;

            const item = batch[0];
            const challenge = lesson.challenge || {};
            const trapOptions = Array.isArray(challenge.traps) ? challenge.traps : [];
            concepts.push({
                topic: item.topic || lesson.title || '?',
                q: item.q,
                correct: item.correct,
                wrong: item.wrong,
                options: [item.correct, item.wrong, ...trapOptions]
                    .map((v) => String(v || '').trim())
                    .filter(Boolean)
                    .filter((v, idx, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === idx),
                status: 'pending',
                lessonId: lesson.id
            });
        }
        return concepts;
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
        this.ui.dialogueStack.style.display = 'none';
        this.ui.dialogueBox.style.display = 'none';
        this.ui.btnNext.style.display = 'none';
        this.ui.overlay.style.display = 'none';
        this.ui.textOverlay.style.display = 'none';
        this.ui.choiceOverlay.style.display = 'none';
        this.ui.choiceOptions.innerHTML = '';
        if (this.ui.gameUi) this.ui.gameUi.classList.remove('has-choices');
    }

    addPlayerScore(amount) {
        const player = this.students[2];
        player.score += amount;

        if (window.arborito) {
            window.arborito.xp(amount);
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

            const concepts = await this.loadClassConcepts(3);
            if (concepts.length > 0) {
                this.lessonData.concepts = concepts;
                const introTopic = concepts.map((c) => c.topic).filter(Boolean).join(', ');
                await this.showDialogue(
                    'PROFESSOR',
                    `${this.getLine('NEW_TOPIC')}${introTopic || '…'}`
                );
                await this.runRound();
            } else {
                /* Whole playlist had no playable Quiz V2 questionnaires. Don't ask
                   the student to write content — show a short neutral line and
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
                isCorrect = this.answersMatch(playerText, concept.correct);
            }

            if (isCorrect) {
                this.shout(this.getLine('CORRECT'), true);
                this.spawnParticles(student.x, student.y, '#4ade80');
                this.addPlayerScore(20);
                concept.status = 'correct';
                await this.showDialogue("PROFESSOR", this.getLine('GOOD_JOB', { answer: concept.correct }));
            } else {
                this.shout(this.getLine('WRONG'), false);
                this.shakeScreen();
                this.spawnParticles(student.x, student.y, '#ef4444');
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
                this.addPlayerScore(10);
                concept.status = 'correct';
                await this.showDialogue("PROFESSOR", this.getLine('WELL_SPOTTED'));
            } else {
                this.shout(this.getLine('OBJECTION'), false);
                this.shakeScreen();
                this.spawnParticles(this.students[2].x, this.students[2].y, '#ef4444');
                if (isRight) {
                    await this.showDialogue("PROFESSOR", this.getLine('STUDENT_WAS_CORRECT', { name: student.name }));
                } else {
                    await this.showDialogue("PROFESSOR", this.getLine('PAY_ATTENTION'));
                }
                concept.status = 'wrong';
            }
        }
        this.currentRound++;
        await this.runRound();
    }

    async victory() {
        this.state = 'VICTORY';
        const pScore = this.students[2].score;
        this.shout(this.getLine('DISMISSED'));

        await this.showDialogue("PROFESSOR", this.getLine('FINAL_TALLY', { score: pScore }));

        this.loadContent();
    }

    waitForInput() {
        this.ui.overlay.style.display = 'flex';
        return new Promise(resolve => this.inputResolver = resolve);
    }

    waitForText() {
        this.ui.textOverlay.style.display = 'flex';
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
