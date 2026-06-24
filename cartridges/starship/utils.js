/** Suppress duplicate click after touch; ignore drags beyond SLOP px. */
export function bindMobileTap(el, handler) {
    if (!el) return () => {};
    let sx = 0, sy = 0, lastTouchAt = 0, tracking = false;
    const SLOP = 14;

    const onTouchStart = (e) => {
        const t = e.touches?.[0];
        if (!t) return;
        sx = t.clientX;
        sy = t.clientY;
        tracking = true;
    };

    const onTouchEnd = (e) => {
        if (!tracking) return;
        tracking = false;
        const t = e.changedTouches?.[0];
        if (!t) return;
        if (Math.abs(t.clientX - sx) > SLOP || Math.abs(t.clientY - sy) > SLOP) return;
        e.preventDefault();
        lastTouchAt = Date.now();
        handler(e);
    };

    const onTouchCancel = () => { tracking = false; };

    const onClick = (e) => {
        if (Date.now() - lastTouchAt < 450) return;
        handler(e);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });
    el.addEventListener('click', onClick);
    return () => {
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchend', onTouchEnd);
        el.removeEventListener('touchcancel', onTouchCancel);
        el.removeEventListener('click', onClick);
    };
}

export class InputManager {
    constructor() {
        this.keys = {};
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', e => {
            this.keys[e.key] = false;
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    setKey(key, isActive) {
        this.keys[key] = isActive;
        if (key.length === 1) {
            this.keys[key.toLowerCase()] = isActive;
            this.keys[key.toUpperCase()] = isActive;
        }
    }

    consume(k) {
        if (this.keys[k]) {
            this.keys[k] = false;
            return true;
        }
        return false;
    }

    reset() {
        this.keys = {};
    }
}

export class SeededRandom {
    constructor(seed) {
        this.seed = this.hashString(seed || "treesys-rng");
    }
    hashString(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) hash = ((hash << 5) + hash) + str.charCodeAt(i);
        return hash;
    }
    next() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
    range(min, max) { return min + this.next() * (max - min); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }

    noise(x) {
        const i = Math.floor(x);
        const f = x - i;
        const w = f * f * (3 - 2 * f);
        const s = Math.sin((i * 12.9898) * 43758.5453) * 10000;
        const n1 = s - Math.floor(s);
        const s2 = Math.sin(((i + 1) * 12.9898) * 43758.5453) * 10000;
        const n2 = s2 - Math.floor(s2);
        return n1 * (1 - w) + n2 * w;
    }
}

export function rectIntersect(r1, r2) {
    return !(r2.x >= r1.x + r1.w || r2.x + r2.w <= r1.x || r2.y >= r1.y + r1.h || r2.y + r2.h <= r1.y);
}

export const ArtGen = {
    createPlanetTexture: (radius, colorBase, seed) => {
        const size = radius * 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const rng = new SeededRandom(seed);

        const cx = radius;
        const cy = radius;

        const grad = ctx.createRadialGradient(cx - radius*0.3, cy - radius*0.3, radius*0.1, cx, cy, radius);
        grad.addColorStop(0, colorBase);
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.fill();

        ctx.globalCompositeOperation = 'overlay';
        for(let i=0; i<40; i++) {
            const w = rng.range(radius * 0.2, radius * 1.5);
            const h = rng.range(radius * 0.05, radius * 0.2);
            const x = rng.range(0, size);
            const y = rng.range(0, size);
            const rot = rng.range(-0.5, 0.5);

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.fillStyle = rng.next() > 0.5 ? '#ffffff33' : '#00000033';
            ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.fill();

        return canvas;
    },

    createNebulaBackground: (w, h, seed = 'nebula') => {
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        const rng = new SeededRandom(seed);

        ctx.fillStyle = '#020617';
        ctx.fillRect(0,0,w,h);

        const bgGrad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w * 0.7);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        for(let layer = 0; layer < 3; layer++) {
            for(let i=0; i<12; i++) {
                const x = rng.range(0, w);
                const y = rng.range(0, h);
                const r = rng.range(150, 450);
                const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
                const hue = rng.range(200, 320);
                const alpha = 0.04 + layer * 0.03;
                grad.addColorStop(0, `hsla(${hue}, 80%, 35%, ${alpha})`);
                grad.addColorStop(0.5, `hsla(${hue + 30}, 60%, 20%, ${alpha * 0.5})`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.globalCompositeOperation = 'screen';
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
            }
        }

        ctx.globalCompositeOperation = 'source-over';
        for(let i=0; i<800; i++) {
            const bright = rng.next() > 0.92;
            ctx.fillStyle = bright ? rng.pick(['#a5f3fc', '#fde68a', '#f0abfc']) : '#fff';
            ctx.globalAlpha = rng.range(0.2, 1);
            const sz = bright ? rng.range(1.5, 3) : rng.range(0.3, 1.2);
            ctx.beginPath(); ctx.arc(rng.range(0,w), rng.range(0,h), sz, 0, Math.PI*2); ctx.fill();
        }

        for (let i = 0; i < 5; i++) {
            const gx = rng.range(0, w), gy = rng.range(0, h);
            const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, rng.range(20, 60));
            grad.addColorStop(0, `hsla(${rng.range(260,320)}, 50%, 60%, 0.15)`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(gx, gy, 60, 0, Math.PI*2); ctx.fill();
        }

        ctx.globalAlpha = 1;
        return canvas;
    },

    createStarLayer: (count, w, h, seed) => {
        const rng = new SeededRandom(seed);
        return Array.from({ length: count }, () => ({
            x: rng.range(0, w * 4),
            y: rng.range(0, h * 4),
            size: rng.range(0.5, 2.5),
            twinkle: rng.range(0, Math.PI * 2),
            speed: rng.range(0.02, 0.08),
            color: rng.pick(['#fff', '#e0f2fe', '#fef3c7', '#fae8ff'])
        }));
    },

    createAsteroidTexture: (size, seed) => {
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const rng = new SeededRandom(seed);
        const cx = size / 2, cy = size / 2, r = size / 2 - 2;

        ctx.fillStyle = '#475569';
        ctx.beginPath();
        const verts = 10;
        for (let i = 0; i <= verts; i++) {
            const a = (i / verts) * Math.PI * 2;
            const rr = r * rng.range(0.7, 1.0);
            const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();

        ctx.globalCompositeOperation = 'overlay';
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = rng.next() > 0.5 ? '#64748b88' : '#1e293b88';
            ctx.beginPath();
            ctx.arc(rng.range(4, size-4), rng.range(4, size-4), rng.range(2, 8), 0, Math.PI*2);
            ctx.fill();
        }
        return canvas;
    }
};

export const Sprites = {
    drawShipLanded: (ctx, x, y) => {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.ellipse(32, 60, 25, 5, 0, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#475569';
        ctx.beginPath(); ctx.moveTo(10, 40); ctx.lineTo(0, 60); ctx.lineTo(8, 60); ctx.lineTo(20, 40); ctx.fill();
        ctx.beginPath(); ctx.moveTo(54, 40); ctx.lineTo(64, 60); ctx.lineTo(56, 60); ctx.lineTo(44, 40); ctx.fill();

        const grad = ctx.createLinearGradient(0, 0, 64, 60);
        grad.addColorStop(0, '#e2e8f0');
        grad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(32, 0);
        ctx.quadraticCurveTo(64, 30, 54, 55);
        ctx.lineTo(10, 55);
        ctx.quadraticCurveTo(0, 30, 32, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(32, 0); ctx.lineTo(32, 55); ctx.stroke();

        ctx.fillStyle = '#0ea5e9';
        ctx.shadowColor = '#0ea5e9'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(32, 25, 8, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(30, 23, 2, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    },

    drawAstronaut: (ctx, x, y, facing, state, frame) => {
        ctx.save();
        ctx.translate(x + 16, y + 24);
        ctx.scale(facing, 1);

        let bob = 0;
        if (state === 'run') bob = Math.sin(frame * 0.4) * 2;
        if (state === 'idle') bob = Math.sin(frame * 0.05) * 1;

        if (state === 'run') ctx.rotate(0.1);

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(0, 24, 10, 3, 0, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#94a3b8';
        if (state === 'run') {
            const off = Math.sin(frame * 0.4 + Math.PI) * 6;
            ctx.beginPath(); ctx.roundRect(-6 + off, 10, 6, 14, 3); ctx.fill();
        } else {
            ctx.beginPath(); ctx.roundRect(-6, 10, 6, 14, 3); ctx.fill();
        }

        ctx.translate(0, bob);

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.roundRect(-9, -8, 18, 20, 4); ctx.fill();

        ctx.fillStyle = '#64748b';
        ctx.beginPath(); ctx.roundRect(-13, -6, 4, 16, 2); ctx.fill();

        const hGrad = ctx.createRadialGradient(-3, -13, 2, 0, -10, 12);
        hGrad.addColorStop(0, '#ffffff');
        hGrad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = hGrad;
        ctx.beginPath(); ctx.arc(0, -10, 11, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 5;
        ctx.beginPath(); ctx.roundRect(2, -13, 9, 6, 2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#cbd5e1';
        if (state === 'run') {
            const off = Math.sin(frame * 0.4) * 6;
            ctx.beginPath(); ctx.roundRect(-2 + off, 10, 6, 14, 3); ctx.fill();
        } else {
            ctx.beginPath(); ctx.roundRect(0, 10, 6, 14, 3); ctx.fill();
        }

        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.roundRect(-4, 0, 12, 5, 2); ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.fillRect(6, -1, 8, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(12, -1, 2, 2);

        ctx.restore();
    },

    drawAlien: (ctx, x, y, color, height, frame) => {
        const bob = Math.sin(frame * 0.1) * 3;
        ctx.save();
        ctx.translate(x, y + bob);

        ctx.shadowColor = color; ctx.shadowBlur = 15;

        const grad = ctx.createLinearGradient(0,0,0,height);
        grad.addColorStop(0, color);
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.quadraticCurveTo(32, height/2, 28, height);
        ctx.quadraticCurveTo(16, height-5, 4, height);
        ctx.quadraticCurveTo(0, height/2, 16, 0);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#dcfce7';
        ctx.beginPath(); ctx.ellipse(16, 0, 12, 16, 0, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(12, 2, 3, 5, 0.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(20, 2, 3, 5, -0.2, 0, Math.PI*2); ctx.fill();

        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(28, 10); ctx.lineTo(28, height); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(28, 8, 3, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    },

    drawBlob: (ctx, x, y, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x+16, y);
        ctx.lineTo(x+26, y+10);
        ctx.lineTo(x+32, y+24);
        ctx.lineTo(x+16, y+32);
        ctx.lineTo(x, y+24);
        ctx.lineTo(x+6, y+10);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.moveTo(x+8, y+12); ctx.lineTo(x+14, y+18); ctx.lineTo(x+8, y+18); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x+24, y+12); ctx.lineTo(x+18, y+18); ctx.lineTo(x+24, y+18); ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillRect(x+10, y+15, 2, 2);
        ctx.fillRect(x+20, y+15, 2, 2);
    },

    drawSpaceShip: (ctx, angle, thrust, shieldPct, frame) => {
        ctx.save();
        ctx.rotate(angle);

        if (shieldPct > 0) {
            const pulse = 0.85 + Math.sin(frame * 0.08) * 0.15;
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 * shieldPct * pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, 38 * pulse, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = `rgba(56, 189, 248, ${0.05 * shieldPct})`;
            ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI*2); ctx.fill();
        }

        if (thrust > 0.1) {
            ctx.globalCompositeOperation = 'screen';
            for (let i = 0; i < 3; i++) {
                const len = 15 + thrust * 25 + Math.random() * 10;
                ctx.fillStyle = i === 0 ? '#f59e0b' : i === 1 ? '#ef4444' : '#3b82f6';
                ctx.globalAlpha = 0.7 - i * 0.2;
                ctx.beginPath();
                ctx.moveTo(-14, i === 2 ? 0 : (i === 0 ? -5 : 5));
                ctx.lineTo(-14 - len, 0);
                ctx.lineTo(-14, i === 2 ? 0 : (i === 0 ? -3 : 3));
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(-5, -18); ctx.lineTo(-18, -28); ctx.lineTo(-8, -8); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-5, 18); ctx.lineTo(-18, 28); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();

        const hullGrad = ctx.createLinearGradient(-20, 0, 25, 0);
        hullGrad.addColorStop(0, '#94a3b8');
        hullGrad.addColorStop(0.5, '#e2e8f0');
        hullGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        ctx.moveTo(28, 0);
        ctx.lineTo(-15, 14);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-15, -14);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(-8, -10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(10, 6); ctx.lineTo(-8, 10); ctx.stroke();

        ctx.fillStyle = '#0ea5e9';
        ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(12, 0); ctx.lineTo(-2, 7); ctx.lineTo(-2, -7); ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(4, -2, 2, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;

        if (Math.sin(frame * 0.15) > 0.8) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(-12, -12, 2, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore();
    },

    drawVoidSkiff: (ctx, frame, aggro) => {
        const wobble = Math.sin(frame * 0.2) * 2;
        ctx.fillStyle = aggro ? '#7f1d1d' : '#450a0a';
        if (aggro) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(20 + wobble, 0);
            ctx.lineTo(-10, 10);
            ctx.lineTo(-5, 0);
            ctx.lineTo(-10, -10);
            ctx.closePath();
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(20 + wobble, 0);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, -10);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath(); ctx.arc(-5, 0, 3, 0, Math.PI*2); ctx.fill();
    },

    drawCrystal: (ctx, x, y, frame, collected) => {
        if (collected) return;
        const bob = Math.sin(frame * 0.08) * 4;
        const glow = 0.6 + Math.sin(frame * 0.12) * 0.4;
        ctx.save();
        ctx.translate(x, y + bob);
        ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 15 * glow;
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(0, -14); ctx.lineTo(10, 0); ctx.lineTo(0, 14); ctx.lineTo(-10, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#a5f3fc'; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5, 0); ctx.lineTo(0, 8); ctx.lineTo(-5, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    },

    drawBossBlob: (ctx, x, y, frame, hpPct) => {
        const pulse = 1 + Math.sin(frame * 0.06) * 0.15;
        const size = 48 * pulse;
        ctx.save();
        ctx.translate(x + size/2, y + size/2);
        ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 25;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        grad.addColorStop(0, '#a78bfa');
        grad.addColorStop(0.5, '#6d28d9');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const r = size * (0.7 + Math.sin(frame * 0.1 + i) * 0.15);
            const px = Math.cos(a) * r, py = Math.sin(a) * r;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(-12, -5, 8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(12, -5, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(-10, -5, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(14, -5, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-30, -size - 15, 60, 6);
        ctx.fillStyle = hpPct > 0.3 ? '#a78bfa' : '#ef4444';
        ctx.fillRect(-30, -size - 15, 60 * hpPct, 6);
        ctx.restore();
    },

    drawHut: (ctx, x, y, w, h, baseColor) => {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.ellipse(w/2, h, w/2 + 10, 10, 0, 0, Math.PI*2); ctx.fill();

        const grad = ctx.createLinearGradient(0,0,0,h);
        grad.addColorStop(0, '#475569');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.quadraticCurveTo(0, 0, w/2, 0);
        ctx.quadraticCurveTo(w, 0, w, h);
        ctx.fill();

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(5, h-10); ctx.quadraticCurveTo(w/2, h-30, w-5, h-10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(15, h-40); ctx.quadraticCurveTo(w/2, h-60, w-15, h-40); ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(w/2, h, 15, 25, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
        ctx.beginPath();
        ctx.ellipse(w/2, h, 10, 20, 0, Math.PI, 0);
        ctx.fill();

        ctx.strokeStyle = '#94a3b8';
        ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, -15); ctx.stroke();
        ctx.fillStyle = baseColor;
        ctx.beginPath(); ctx.arc(w/2, -15, 3, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    }
};
