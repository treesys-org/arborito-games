/** Procedural pixel sprites for classroom characters (16-color flat palette). */
export const Colors = {
    bg: '#bfb39e',
    bgShade: '#a89e8c',
    floor: '#5b3d24',
    floorLine: '#3f2716',
    board: '#1f2e23',
    boardFrame: '#5c4033',
    chalk: '#e8f5ee',
    skin: '#f7d5a8',
    skinShade: '#d9a87a',
    skinDark: '#b87a4a',
    blush: '#ef9aa2',
    hairProf: '#2a1f1a',
    hairProfShade: '#1a1311',
    suitProf: '#2f3b46',
    suitProfShade: '#1e2730',
    tie: '#c0392b',
    glasses: '#1c1c1c',
    glassesShine: '#9bd5ff',
    lola: '#ef4444',
    lolaShade: '#b91c1c',
    timmy: '#3b82f6',
    timmyShade: '#1d4ed8',
    player: '#22c55e',
    playerShade: '#15803d',
    mouth: '#7b3f20',
    deskTop: '#a8581f',
    deskTopShine: '#cc6b25',
    deskSide: '#7c3f15',
    deskShadow: '#3e1e08',
    term_green: '#4ade80'
};

export class SpriteGen {
    static createCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        return { c, ctx };
    }

    static volumeRect(ctx, x, y, w, h, fill, shade) {
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, w, h);
        if (shade) {
            ctx.fillStyle = shade;
            ctx.fillRect(x, y + h - 1, w, 1);
            ctx.fillRect(x + w - 1, y, 1, h);
        }
    }

    static drawHead(ctx, x, y, opts = {}) {
        const w = 28;
        const h = 28;
        ctx.fillStyle = Colors.skin;
        ctx.fillRect(x + 2, y, w - 4, h);
        ctx.fillRect(x, y + 2, w, h - 4);
        ctx.fillStyle = Colors.skinShade;
        ctx.fillRect(x + w - 4, y + 4, 2, h - 8);
        ctx.fillRect(x + 4, y + h - 2, w - 8, 2);
        if (opts.blush !== false) {
            ctx.fillStyle = Colors.blush;
            ctx.fillRect(x + 4, y + 16, 3, 2);
            ctx.fillRect(x + w - 7, y + 16, 3, 2);
        }
    }

    static drawEyes(ctx, x, y, opts = {}) {
        const wide = opts.wide ?? false;
        const happy = opts.happy ?? false;
        ctx.fillStyle = Colors.glasses;
        if (happy) {
            ctx.fillRect(x + 7, y + 10, 1, 1);
            ctx.fillRect(x + 8, y + 9, 2, 1);
            ctx.fillRect(x + 10, y + 10, 1, 1);
            ctx.fillRect(x + 17, y + 10, 1, 1);
            ctx.fillRect(x + 18, y + 9, 2, 1);
            ctx.fillRect(x + 20, y + 10, 1, 1);
        } else {
            const ew = wide ? 4 : 3;
            const eh = wide ? 4 : 3;
            ctx.fillRect(x + 7, y + 10, ew, eh);
            ctx.fillRect(x + 18, y + 10, ew, eh);
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 8, y + 10, 1, 1);
            ctx.fillRect(x + 19, y + 10, 1, 1);
        }
    }

    static drawMouth(ctx, x, y, kind = 'smile') {
        ctx.fillStyle = Colors.mouth;
        if (kind === 'smile') {
            ctx.fillRect(x + 11, y + 20, 6, 1);
            ctx.fillRect(x + 10, y + 19, 1, 1);
            ctx.fillRect(x + 17, y + 19, 1, 1);
        } else if (kind === 'open') {
            ctx.fillRect(x + 12, y + 19, 4, 4);
            ctx.fillStyle = '#3a1810';
            ctx.fillRect(x + 13, y + 20, 2, 2);
        } else if (kind === 'flat') {
            ctx.fillRect(x + 11, y + 20, 6, 1);
        } else if (kind === 'frown') {
            ctx.fillRect(x + 11, y + 21, 6, 1);
            ctx.fillRect(x + 10, y + 22, 1, 1);
            ctx.fillRect(x + 17, y + 22, 1, 1);
        }
    }

    static generateProfessor() {
        const { c, ctx } = this.createCanvas(40, 48);
        this.volumeRect(ctx, 4, 26, 32, 22, Colors.suitProf, Colors.suitProfShade);
        ctx.fillStyle = Colors.suitProfShade;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(16 - i, 26 + i, 1, 1);
            ctx.fillRect(23 + i, 26 + i, 1, 1);
        }
        ctx.fillStyle = Colors.tie;
        ctx.fillRect(19, 26, 2, 12);
        ctx.fillRect(18, 28, 4, 8);
        ctx.fillStyle = Colors.skinShade;
        ctx.fillRect(17, 24, 6, 3);
        this.drawHead(ctx, 6, 0, { blush: false });
        ctx.fillStyle = Colors.hairProf;
        ctx.fillRect(6, 0, 28, 6);
        ctx.fillRect(4, 2, 4, 14);
        ctx.fillRect(32, 2, 4, 14);
        ctx.fillStyle = Colors.hairProfShade;
        ctx.fillRect(6, 6, 28, 1);
        ctx.fillStyle = Colors.glasses;
        ctx.fillRect(11, 14, 7, 5);
        ctx.fillRect(22, 14, 7, 5);
        ctx.fillRect(18, 16, 4, 1);
        ctx.fillRect(8, 16, 3, 1);
        ctx.fillRect(29, 16, 3, 1);
        ctx.fillStyle = '#cfd8dc';
        ctx.fillRect(12, 15, 5, 3);
        ctx.fillRect(23, 15, 5, 3);
        ctx.fillStyle = Colors.glassesShine;
        ctx.fillRect(12, 15, 2, 1);
        ctx.fillRect(23, 15, 2, 1);
        this.drawMouth(ctx, 6, 0, 'flat');
        ctx.fillStyle = Colors.hairProf;
        ctx.fillRect(11, 13, 7, 1);
        ctx.fillRect(22, 13, 7, 1);
        return c;
    }

    static generateStudent(variant) {
        const { c, ctx } = this.createCanvas(40, 48);
        const shirt = variant.shirt;
        const shirtShade = variant.shirtShade;

        this.volumeRect(ctx, 4, 26, 32, 22, shirt, shirtShade);
        ctx.fillStyle = shirtShade;
        ctx.fillRect(17, 26, 6, 3);
        ctx.fillStyle = Colors.skin;
        ctx.fillRect(18, 26, 4, 2);
        ctx.fillStyle = Colors.skinShade;
        ctx.fillRect(17, 24, 6, 3);

        this.drawHead(ctx, 6, 0);

        if (variant.hairStyle === 'pigtails') {
            ctx.fillStyle = variant.hair;
            ctx.fillRect(6, 0, 28, 9);
            ctx.fillRect(4, 4, 3, 8);
            ctx.fillRect(33, 4, 3, 8);
            ctx.fillRect(2, 8, 4, 8);
            ctx.fillRect(34, 8, 4, 8);
            ctx.fillStyle = variant.hairShade;
            ctx.fillRect(8, 7, 24, 2);
            ctx.fillStyle = Colors.tie;
            ctx.fillRect(2, 11, 4, 2);
            ctx.fillRect(34, 11, 4, 2);
        } else if (variant.hairStyle === 'short') {
            ctx.fillStyle = variant.hair;
            ctx.fillRect(6, 0, 28, 8);
            ctx.fillRect(4, 3, 4, 8);
            ctx.fillRect(32, 3, 4, 8);
            ctx.fillRect(12, 7, 4, 2);
            ctx.fillRect(20, 7, 6, 2);
            ctx.fillStyle = variant.hairShade;
            ctx.fillRect(6, 7, 28, 1);
        } else if (variant.hairStyle === 'sprout') {
            ctx.fillStyle = variant.hair;
            ctx.fillRect(6, 2, 28, 7);
            ctx.fillRect(4, 5, 4, 6);
            ctx.fillRect(32, 5, 4, 6);
            ctx.fillStyle = variant.hairShade;
            ctx.fillRect(6, 7, 28, 1);
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(19, 0, 2, 3);
            ctx.fillRect(17, 0, 2, 1);
            ctx.fillRect(21, 0, 2, 1);
        }

        this.drawEyes(ctx, 6, 0, { happy: variant.happy });
        this.drawMouth(ctx, 6, 0, variant.mouth || 'smile');

        if (variant.glasses) {
            ctx.fillStyle = Colors.glasses;
            ctx.fillRect(11, 13, 7, 5);
            ctx.fillRect(22, 13, 7, 5);
            ctx.fillRect(18, 15, 4, 1);
            ctx.fillStyle = '#cfd8dc';
            ctx.fillRect(12, 14, 5, 3);
            ctx.fillRect(23, 14, 5, 3);
        }
        if (variant.freckles) {
            ctx.fillStyle = Colors.skinDark;
            ctx.fillRect(12, 17, 1, 1);
            ctx.fillRect(14, 18, 1, 1);
            ctx.fillRect(25, 17, 1, 1);
            ctx.fillRect(27, 18, 1, 1);
        }

        return c;
    }

    static generateBackground(w, h) {
        const { c, ctx } = this.createCanvas(w, h);

        ctx.fillStyle = Colors.bg;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = Colors.bgShade;
        for (let y = 0; y < h * 0.62; y += 8) {
            ctx.fillRect(0, y, w, 1);
        }

        const floorY = h * 0.62;
        ctx.fillStyle = Colors.floor;
        ctx.fillRect(0, floorY, w, h - floorY);
        ctx.strokeStyle = Colors.floorLine;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 8; i++) {
            ctx.beginPath();
            ctx.moveTo((w / 8) * i, floorY);
            ctx.lineTo(w / 2 + (w / 2) * ((i - 4) / 4) * 0.6, h);
            ctx.stroke();
        }
        for (let i = 1; i <= 3; i++) {
            const yy = floorY + (h - floorY) * (i / 4);
            ctx.beginPath();
            ctx.moveTo(0, yy);
            ctx.lineTo(w, yy);
            ctx.stroke();
        }

        const bx = w * 0.18, by = h * 0.08, bw = w * 0.64, bh = h * 0.36;
        ctx.fillStyle = Colors.boardFrame;
        ctx.fillRect(bx - 12, by - 12, bw + 24, bh + 24);
        ctx.fillStyle = '#3e2916';
        ctx.fillRect(bx - 12, by + bh + 8, bw + 24, 8);
        ctx.fillStyle = Colors.board;
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = 'rgba(232, 245, 238, 0.07)';
        for (let i = 0; i < 12; i++) {
            const sx = bx + 8 + Math.random() * (bw - 16);
            const sy = by + 8 + Math.random() * (bh - 16);
            ctx.fillRect(sx, sy, 18, 1);
        }
        ctx.fillStyle = '#fef9e7';
        ctx.fillRect(bx + 12, by + bh + 9, 14, 4);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(bx + 32, by + bh + 9, 14, 4);

        const cx = w - 70, cy = 40;
        ctx.fillStyle = '#1f2937';
        ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.arc(cx, cy, 21, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            ctx.fillRect(cx + Math.cos(a) * 18 - 1, cy + Math.sin(a) * 18 - 1, 2, 2);
        }
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 8, cy - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 14); ctx.stroke();

        return c;
    }

    static generateDesk() {
        const { c, ctx } = this.createCanvas(96, 72);
        ctx.fillStyle = Colors.deskShadow;
        ctx.fillRect(6, 38, 6, 32);
        ctx.fillRect(84, 38, 6, 32);
        ctx.fillStyle = Colors.deskSide;
        ctx.fillRect(2, 16, 92, 30);
        ctx.fillStyle = Colors.deskTop;
        ctx.fillRect(0, 6, 96, 16);
        ctx.fillStyle = Colors.deskTopShine;
        ctx.fillRect(0, 6, 96, 3);
        ctx.fillStyle = Colors.deskShadow;
        ctx.fillRect(0, 22, 96, 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(58, 10, 26, 10);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(58, 10, 26, 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(20, 12, 22, 3);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(42, 12, 3, 3);
        return c;
    }
}
