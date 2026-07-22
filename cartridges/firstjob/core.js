export const CONFIG = {
    W: 320,
    H: 240,
    TILE: 16,
    MOVE_DELAY: 130,
    ANIM_SPEED: 0.28,
    SHIFT_DURATION: 10800,
    FPS_ASSUME: 60
};

export const STAIR_UP = 3;
export const STAIR_DOWN = 4;
export const ELEV_SIGN = 13;

/** Tile ids that block movement (walls, desks, machines, etc.). */
export const SOLID_TILES = new Set([1, 2, 5, 8, 9, 10, 11]);

export const Palette = {
    bg: '#020617',
    text: '#22d3ee',
    hero: '#3b82f6',
    wall: '#334155',
    floor: '#1e293b',
    floor_alt: '#172033',
    floor_cafe: '#4a044e',
    desk: '#b45309',
    machine: '#94a3b8',
    plant: '#22c55e',
    accent: '#f472b6',
    stress_low: '#22c55e',
    stress_med: '#facc15',
    stress_high: '#ef4444',
    phone_bg: '#1e293b',
    phone_screen: '#0f172a',
    window: '#38bdf8',
    carpet: '#312e81'
};

export const Themes = {
    corporate: { bg: '#020617', text: '#22d3ee', hero: '#3b82f6', wall: '#334155', floor: '#1e293b', floor_alt: '#172033', floor_cafe: '#4a044e', desk: '#b45309', machine: '#94a3b8', plant: '#22c55e', accent: '#f472b6', phone_bg: '#1e293b', phone_screen: '#0f172a', window: '#38bdf8', carpet: '#312e81' },
    lab: { bg: '#0f172a', text: '#38bdf8', hero: '#f8fafc', wall: '#cbd5e1', floor: '#475569', floor_alt: '#3f4d5e', floor_cafe: '#64748b', desk: '#e2e8f0', machine: '#94a3b8', plant: '#4ade80', accent: '#2dd4bf', phone_bg: '#1e293b', phone_screen: '#0f172a', window: '#7dd3fc', carpet: '#334155' },
    studio: { bg: '#292524', text: '#fdba74', hero: '#fb923c', wall: '#78350f', floor: '#44403c', floor_alt: '#3b3836', floor_cafe: '#57534e', desk: '#d97706', machine: '#a8a29e', plant: '#84cc16', accent: '#fbbf24', phone_bg: '#451a03', phone_screen: '#292524', window: '#fcd34d', carpet: '#57534e' },
    industrial: { bg: '#042f2e', text: '#4ade80', hero: '#2dd4bf', wall: '#134e4a', floor: '#064e3b', floor_alt: '#065f46', floor_cafe: '#14532d', desk: '#65a30d', machine: '#71717a', plant: '#bef264', accent: '#34d399', phone_bg: '#115e59', phone_screen: '#042f2e', window: '#6ee7b7', carpet: '#134e4a' }
};

export function setTheme(themeName) {
    Object.assign(Palette, Themes[themeName] || Themes.corporate);
    SpriteGen._tiles = null;
}

export function formatShiftTime(framesLeft) {
    const sec = Math.max(0, Math.ceil(framesLeft / CONFIG.FPS_ASSUME));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export class ParticleSystem {
    constructor() { this.particles = []; }

    spawn(x, y, color, count = 5, opts = {}) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * (opts.spread || 4),
                vy: (Math.random() - 0.5) * (opts.spread || 4) - (opts.upward ? 1.5 : 0),
                life: 1,
                decay: opts.decay || 0.04,
                color: color || '#fff',
                size: Math.random() * (opts.size || 3) + 1,
                gravity: opts.gravity || 0
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }
}

export class TextManager {
    constructor() { this.texts = []; }

    spawn(x, y, text, color = '#fff') {
        this.texts.push({ x, y, text, color, life: 1, vy: -0.6, scale: 1 });
    }

    update() {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.y += t.vy;
            t.life -= 0.018;
            if (t.life <= 0) this.texts.splice(i, 1);
        }
    }
}

export class AudioSynth {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.enabled = false;
    }

    ensure() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.28;
            this.master.connect(this.ctx.destination);
            this.enabled = true;
        } catch (_) {}
    }

    play(freq, type, dur, vol = 0.1) {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    }

    sfxMove() { this.play(120, 'triangle', 0.04, 0.06); }
    sfxBump() { this.play(55, 'sawtooth', 0.08, 0.12); }
    sfxSelect() { this.play(520, 'square', 0.06, 0.08); }
    sfxPhone() {
        this.play(640, 'square', 0.08, 0.1);
        setTimeout(() => this.play(880, 'square', 0.08, 0.1), 120);
        setTimeout(() => this.play(640, 'square', 0.08, 0.1), 240);
    }
    sfxSuccess() { this.play(523, 'sine', 0.08); setTimeout(() => this.play(784, 'sine', 0.18), 90); }
    sfxError() { this.play(140, 'sawtooth', 0.15); setTimeout(() => this.play(90, 'sawtooth', 0.2), 100); }
    sfxCash() { this.play(1200, 'sine', 0.04, 0.1); setTimeout(() => this.play(1600, 'sine', 0.12, 0.1), 60); }
    sfxEat() { this.play(220, 'sawtooth', 0.06); setTimeout(() => this.play(280, 'triangle', 0.08), 80); }
    sfxElevator() { this.play(180, 'sine', 0.15, 0.06); setTimeout(() => this.play(240, 'sine', 0.2, 0.06), 150); }
    sfxBurnout() { this.play(90, 'sawtooth', 1.2, 0.35); }
}

export class Input {
    constructor() {
        this.keys = { UP: false, DOWN: false, LEFT: false, RIGHT: false, A: false, B: false };
        window.addEventListener('keydown', e => this.onKey(e, true));
        window.addEventListener('keyup', e => this.onKey(e, false));
        this.bindBtn('btn-up', 'UP');
        this.bindBtn('btn-down', 'DOWN');
        this.bindBtn('btn-left', 'LEFT');
        this.bindBtn('btn-right', 'RIGHT');
        this.bindBtn('btn-a', 'A');
        this.bindBtn('btn-b', 'B');
    }

    onKey(e, isDown) {
        if (document.activeElement?.tagName === 'INPUT') {
            if (e.key === 'Enter' && isDown) document.getElementById('btn-submit-task')?.click();
            return;
        }
        const map = {
            ArrowUp: 'UP', w: 'UP', W: 'UP',
            ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
            ArrowLeft: 'LEFT', a: 'LEFT',
            ArrowRight: 'RIGHT', d: 'RIGHT',
            Enter: 'A', z: 'A', Z: 'A', ' ': 'A',
            Escape: 'B', x: 'B', X: 'B'
        };
        if (map[e.key]) {
            e.preventDefault();
            this.keys[map[e.key]] = isDown;
            this.updateVisuals(map[e.key], isDown);
        }
    }

    bindBtn(id, key) {
        const el = document.getElementById(id);
        if (!el) return;
        const set = (active) => {
            this.keys[key] = active;
            el.classList.toggle('active', active);
        };
        el.addEventListener('pointerdown', e => { e.preventDefault(); set(true); });
        el.addEventListener('pointerup', e => { e.preventDefault(); set(false); });
        el.addEventListener('pointerleave', e => { e.preventDefault(); set(false); });
        el.addEventListener('contextmenu', e => e.preventDefault());
    }

    updateVisuals(key, active) {
        const map = { UP: 'btn-up', DOWN: 'btn-down', LEFT: 'btn-left', RIGHT: 'btn-right', A: 'btn-a', B: 'btn-btn' };
        const id = map[key] === 'btn-btn' ? 'btn-b' : map[key];
        document.getElementById(id)?.classList.toggle('active', active);
    }

    consume(key) {
        if (this.keys[key]) {
            this.keys[key] = false;
            this.updateVisuals(key, false);
            return true;
        }
        return false;
    }
}

export class SpriteGen {
    static create(w, h, fn) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        fn(c.getContext('2d'), w, h);
        return c;
    }

    static get hero() {
        return this.create(16, 16, (ctx) => {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(8, 14, 5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1e3a5f';
            ctx.fillRect(4, 9, 8, 5);
            ctx.fillStyle = Palette.hero;
            ctx.fillRect(3, 9, 10, 4);
            ctx.fillStyle = '#fff';
            ctx.fillRect(5, 10, 6, 1);
            ctx.fillStyle = '#fde68a';
            ctx.fillRect(5, 2, 6, 7);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(5, 4, 2, 2);
            ctx.fillRect(9, 4, 2, 2);
            ctx.fillStyle = '#fca5a5';
            ctx.fillRect(6, 7, 4, 1);
            ctx.fillStyle = '#334155';
            ctx.fillRect(4, 0, 8, 3);
            ctx.fillRect(3, 1, 2, 4);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(7, 9, 2, 5);
        });
    }

    static heroWalk(frame) {
        const bob = frame % 2 === 0 ? 0 : 1;
        return this.create(16, 16, (ctx) => {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(8, 14, 5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1e3a5f';
            ctx.fillRect(4, 9 + bob, 3, 4 - bob);
            ctx.fillRect(9, 9 + (1 - bob), 3, 4 - (1 - bob));
            ctx.fillStyle = Palette.hero;
            ctx.fillRect(3, 9, 10, 4);
            ctx.fillStyle = '#fde68a';
            ctx.fillRect(5, 2, 6, 7);
            ctx.fillStyle = '#334155';
            ctx.fillRect(4, 0, 8, 3);
        });
    }

    static human(shirtColor, hairColor, isVendor = false) {
        return this.create(16, 16, (ctx) => {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(8, 14, 4, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = shirtColor || '#64748b';
            ctx.fillRect(4, 8, 8, 6);
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(7, 8, 2, 5);
            ctx.fillStyle = '#fde68a';
            ctx.fillRect(5, 2, 6, 6);
            ctx.fillStyle = hairColor || '#1e293b';
            ctx.fillRect(4, 1, 8, 3);
            ctx.fillRect(3, 2, 2, 3);
            if (isVendor) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(4, 0, 8, 2);
                ctx.fillRect(5, 9, 6, 4);
                ctx.fillStyle = '#f472b6';
                ctx.fillRect(6, 10, 4, 2);
            }
        });
    }

    static get recruiterFace() {
        return this.create(64, 64, (ctx) => {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 64, 64);
            ctx.fillStyle = '#fde68a';
            ctx.beginPath();
            ctx.ellipse(32, 28, 14, 16, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#334155';
            ctx.fillRect(14, 8, 36, 12);
            ctx.fillRect(12, 14, 6, 10);
            ctx.fillStyle = '#fff';
            ctx.fillRect(18, 44, 28, 16);
            ctx.fillStyle = Palette.text;
            ctx.fillRect(28, 44, 8, 16);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(30, 48, 4, 8);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(22, 26, 5, 4);
            ctx.fillRect(37, 26, 5, 4);
            ctx.fillStyle = '#fff';
            ctx.fillRect(23, 27, 2, 2);
            ctx.fillRect(38, 27, 2, 2);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(32, 36, 6, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
        });
    }

    static get tiles() {
        if (this._tiles) return this._tiles;
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 16;
        const ctx = c.getContext('2d');
        const draw = (idx, fn) => fn(ctx, idx * 16, 0);

        draw(0, (g, x) => {
            g.fillStyle = Palette.floor;
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = Palette.floor_alt;
            g.fillRect(x, 0, 8, 8);
            g.fillRect(x + 8, 8, 8, 8);
            g.fillStyle = 'rgba(255,255,255,0.04)';
            g.fillRect(x + 2, 2, 4, 4);
        });

        draw(1, (g, x) => {
            g.fillStyle = Palette.wall;
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = 'rgba(255,255,255,0.08)';
            g.fillRect(x, 0, 16, 2);
            g.fillStyle = 'rgba(0,0,0,0.25)';
            g.fillRect(x, 14, 16, 2);
            g.fillStyle = Palette.bg;
            g.fillRect(x + 1, 1, 14, 1);
        });

        draw(2, (g, x) => {
            g.fillStyle = Palette.floor;
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = Palette.desk;
            g.fillRect(x + 2, 4, 12, 9);
            g.fillStyle = '#78350f';
            g.fillRect(x + 2, 13, 12, 2);
            g.fillStyle = '#fff';
            g.fillRect(x + 4, 6, 8, 5);
            g.fillStyle = Palette.window;
            g.globalAlpha = 0.35;
            g.fillRect(x + 5, 7, 6, 3);
            g.globalAlpha = 1;
        });

        draw(3, (g, x) => {
            g.fillStyle = '#0f172a';
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = '#334155';
            g.fillRect(x + 1, 1, 14, 14);
            for (let i = 0; i < 5; i++) {
                g.fillStyle = i % 2 ? '#94a3b8' : '#e2e8f0';
                g.fillRect(x + 2 + i, 13 - i * 2, 12 - i * 2, 2);
            }
            g.fillStyle = '#4ade80';
            g.fillRect(x + 5, 2, 6, 6);
            g.fillStyle = '#052e16';
            g.font = 'bold 9px monospace';
            g.fillText('▲', x + 6, 8);
            g.fillStyle = '#fff';
            g.font = 'bold 5px monospace';
            g.fillText('UP', x + 4, 15);
        });

        draw(4, (g, x) => {
            g.fillStyle = '#0f172a';
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = '#334155';
            g.fillRect(x + 1, 1, 14, 14);
            for (let i = 0; i < 5; i++) {
                g.fillStyle = i % 2 ? '#94a3b8' : '#e2e8f0';
                g.fillRect(x + 2 + i, 3 + i * 2, 12 - i * 2, 2);
            }
            g.fillStyle = '#38bdf8';
            g.fillRect(x + 5, 8, 6, 6);
            g.fillStyle = '#0c4a6e';
            g.font = 'bold 9px monospace';
            g.fillText('▼', x + 6, 14);
            g.fillStyle = '#fff';
            g.font = 'bold 5px monospace';
            g.fillText('DN', x + 4, 7);
        });

        draw(5, (g, x) => {
            g.fillStyle = Palette.floor;
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = '#64748b';
            g.fillRect(x + 7, 0, 2, 16);
            g.fillStyle = Palette.desk;
            g.fillRect(x + 1, 5, 6, 8);
            g.fillRect(x + 9, 5, 6, 8);
        });

        draw(6, (g, x) => {
            g.fillStyle = Palette.floor_cafe;
            g.fillRect(x, 0, 16, 16);
            for (let iy = 0; iy < 4; iy++) {
                for (let ix = 0; ix < 4; ix++) {
                    g.fillStyle = (ix + iy) % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
                    g.fillRect(x + ix * 4, iy * 4, 4, 4);
                }
            }
        });

        draw(7, (g, x) => {
            g.fillStyle = Palette.carpet;
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = 'rgba(255,255,255,0.05)';
            g.fillRect(x + 4, 4, 8, 8);
        });

        draw(8, (g, x) => {
            g.fillStyle = Palette.floor_cafe;
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = Palette.machine;
            g.fillRect(x, 0, 4, 16);
            g.fillRect(x + 12, 0, 4, 16);
            g.fillStyle = '#cbd5e1';
            g.fillRect(x + 4, 3, 8, 10);
            g.fillStyle = Palette.accent;
            g.fillRect(x + 6, 6, 4, 2);
        });

        draw(9, (g, x) => {
            g.fillStyle = Palette.floor;
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = '#78350f';
            g.fillRect(x + 6, 12, 4, 4);
            g.fillStyle = Palette.plant;
            g.beginPath();
            g.arc(x + 8, 8, 5, 0, Math.PI * 2);
            g.fill();
            g.fillStyle = '#15803d';
            g.beginPath();
            g.arc(x + 6, 6, 3, 0, Math.PI * 2);
            g.fill();
            g.beginPath();
            g.arc(x + 10, 6, 3, 0, Math.PI * 2);
            g.fill();
        });

        draw(10, (g, x) => {
            g.fillStyle = Palette.floor;
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = Palette.machine;
            g.fillRect(x + 3, 4, 10, 10);
            g.fillStyle = '#0f172a';
            g.fillRect(x + 5, 6, 6, 4);
            g.fillStyle = '#22d3ee';
            g.fillRect(x + 6, 7, 1, 1);
            g.fillRect(x + 8, 7, 1, 1);
            g.fillStyle = '#fff';
            g.fillRect(x + 7, 2, 2, 2);
        });

        draw(11, (g, x) => {
            g.fillStyle = Palette.floor_cafe;
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = '#92400e';
            g.fillRect(x + 2, 2, 12, 12);
            g.fillStyle = '#b45309';
            g.fillRect(x + 3, 3, 10, 10);
            g.fillStyle = 'rgba(255,255,255,0.15)';
            g.fillRect(x + 4, 4, 8, 4);
        });

        draw(12, (g, x) => {
            g.fillStyle = Palette.floor;
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = Palette.window;
            g.globalAlpha = 0.25;
            g.fillRect(x + 2, 2, 12, 10);
            g.globalAlpha = 1;
            g.strokeStyle = Palette.wall;
            g.strokeRect(x + 2, 2, 12, 10);
            g.strokeStyle = Palette.wall;
            g.beginPath();
            g.moveTo(x + 8, 2);
            g.lineTo(x + 8, 12);
            g.moveTo(x + 2, 7);
            g.lineTo(x + 14, 7);
            g.stroke();
        });

        draw(13, (g, x) => {
            g.fillStyle = Palette.floor;
            g.fillRect(x, 0, 16, 16);
            g.fillStyle = '#1e293b';
            g.fillRect(x + 1, 2, 14, 12);
            g.strokeStyle = '#facc15';
            g.lineWidth = 1;
            g.strokeRect(x + 1.5, 2.5, 13, 11);
            g.fillStyle = '#facc15';
            g.font = 'bold 5px monospace';
            g.fillText('ELEV', x + 3, 8);
            g.fillStyle = '#94a3b8';
            g.font = '4px monospace';
            g.fillText('LIFT', x + 3, 13);
        });

        this._tiles = c;
        return c;
    }
}
