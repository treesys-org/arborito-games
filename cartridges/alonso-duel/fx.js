export class DuelFX {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.particles = [];
        this.runes = [];
        this.confetti = [];
        this.audioCtx = null;
        this._raf = 0;
        this._reviewMode = false;

        if (this.canvas) {
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this._seedRunes();
            this._loop = this._loop.bind(this);
            this._raf = requestAnimationFrame(this._loop);
        }
    }

    destroy() {
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = 0;
    }

    resize() {
        if (!this.canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = Math.floor(w * dpr);
        this.canvas.height = Math.floor(h * dpr);
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.w = w;
        this.h = h;
    }

    setReviewMode(on) {
        this._reviewMode = !!on;
    }

    async initAudio() {
        if (!window.AudioContext || this.audioCtx) return;
        this.audioCtx = new window.AudioContext();
        if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
    }

    playTone(freq, type, duration, vol = 0.08, delay = 0) {
        if (!this.audioCtx) return;
        const t0 = this.audioCtx.currentTime + delay;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
    }

    playDraw() {
        this.playTone(320 + Math.random() * 80, 'sine', 0.08, 0.05);
        this.playTone(480, 'triangle', 0.06, 0.03, 0.04);
    }

    playFlip() {
        this.playTone(520, 'sine', 0.07, 0.05);
        this.playTone(780, 'sine', 0.05, 0.03, 0.05);
    }

    playBlock() {
        this.playTone(660, 'triangle', 0.12, 0.09);
        this.playTone(880, 'triangle', 0.1, 0.06, 0.06);
    }

    playHit() {
        this.playTone(180, 'sawtooth', 0.18, 0.07);
        this.playTone(120, 'square', 0.22, 0.05, 0.04);
        this.burst(this.w * 0.5, this.h * 0.35, '#fb923c', 18);
    }

    playAttack() {
        this.playTone(240, 'square', 0.08, 0.06);
        this.playTone(360, 'square', 0.1, 0.07, 0.05);
        this.playTone(520, 'triangle', 0.14, 0.08, 0.1);
    }

    playCombo(level) {
        const base = 440 + level * 40;
        this.playTone(base, 'triangle', 0.1, 0.08);
        this.playTone(base * 1.25, 'triangle', 0.12, 0.07, 0.08);
    }

    playTick(urgent) {
        this.playTone(urgent ? 880 : 520, 'sine', 0.04, urgent ? 0.06 : 0.03);
    }

    playVictory() {
        [0, 120, 240, 360, 480].forEach((d, i) => {
            this.playTone(440 + i * 80, 'triangle', 0.2, 0.08, d / 1000);
        });
        this.confettiBurst();
    }

    playDefeat() {
        this.playTone(330, 'sawtooth', 0.25, 0.06);
        this.playTone(220, 'sawtooth', 0.35, 0.05, 0.15);
    }

    burst(x, y, color, count = 14) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color,
                size: 3 + Math.random() * 4
            });
        }
    }

    confettiBurst() {
        for (let i = 0; i < 80; i++) {
            this.confetti.push({
                x: Math.random() * this.w,
                y: -10 - Math.random() * 40,
                vx: (Math.random() - 0.5) * 3,
                vy: 2 + Math.random() * 4,
                rot: Math.random() * Math.PI,
                vr: (Math.random() - 0.5) * 0.2,
                life: 1,
                color: ['#fde047', '#34d399', '#a78bfa', '#fb923c', '#f472b6'][i % 5],
                w: 6 + Math.random() * 6,
                h: 4 + Math.random() * 4
            });
        }
    }

    _seedRunes() {
        const glyphs = ['⚡', '✦', '◆', '▲', '❋', '☽'];
        for (let i = 0; i < 22; i++) {
            this.runes.push({
                x: Math.random(),
                y: Math.random(),
                glyph: glyphs[i % glyphs.length],
                size: 10 + Math.random() * 18,
                speed: 0.00015 + Math.random() * 0.00035,
                phase: Math.random() * Math.PI * 2,
                alpha: 0.08 + Math.random() * 0.14
            });
        }
    }

    _loop() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.h);

        const grad = ctx.createRadialGradient(
            this.w * 0.5,
            this.h * 0.42,
            20,
            this.w * 0.5,
            this.h * 0.5,
            Math.max(this.w, this.h) * 0.75
        );
        if (this._reviewMode) {
            grad.addColorStop(0, 'rgba(251,191,36,.14)');
            grad.addColorStop(0.45, 'rgba(120,53,15,.08)');
            grad.addColorStop(1, 'rgba(2,6,23,0)');
        } else {
            grad.addColorStop(0, 'rgba(124,58,237,.12)');
            grad.addColorStop(0.45, 'rgba(6,78,59,.06)');
            grad.addColorStop(1, 'rgba(2,6,23,0)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.w, this.h);

        ctx.font = '900 14px system-ui,sans-serif';
        for (const r of this.runes) {
            r.y -= r.speed * this.h;
            if (r.y < -0.05) {
                r.y = 1.05;
                r.x = Math.random();
            }
            const pulse = 0.65 + Math.sin(Date.now() * 0.001 + r.phase) * 0.35;
            ctx.globalAlpha = r.alpha * pulse;
            ctx.fillStyle = this._reviewMode ? '#fde68a' : '#c4b5fd';
            ctx.fillText(r.glyph, r.x * this.w, r.y * this.h);
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12;
            p.life -= 0.028;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0, p.size * p.life), 0, Math.PI * 2);
            ctx.fill();
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.06;
            c.rot += c.vr;
            c.life -= 0.004;
            ctx.save();
            ctx.globalAlpha = Math.max(0, c.life);
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rot);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            ctx.restore();
            if (c.life <= 0 || c.y > this.h + 20) this.confetti.splice(i, 1);
        }

        ctx.globalAlpha = 1;
        this._raf = requestAnimationFrame(this._loop);
    }
}
