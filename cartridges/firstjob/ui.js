import { CONFIG, Palette, formatShiftTime, STAIR_UP, STAIR_DOWN } from './core.js';

export class GameUI {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.shakeTimer = 0;
        this.shakeAmount = 0;
        this.scanPhase = 0;
        this.heroWalkFrame = 0;
    }

    triggerShake(amount) {
        this.shakeAmount = amount;
        this.shakeTimer = 12;
    }

    draw() {
        this.scanPhase += 0.5;
        this.ctx.fillStyle = Palette.bg;
        this.ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

        let sx = 0, sy = 0;
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
            sx = (Math.random() - 0.5) * this.shakeAmount;
            sy = (Math.random() - 0.5) * this.shakeAmount;
        }

        this.ctx.save();
        this.ctx.translate(sx, sy);

        const st = this.game.state;
        if (st === 'PROLOGUE') this.drawPrologue();
        else if (st === 'BRIEFING') this.drawBriefing();
        else if (st.startsWith('INTERVIEW')) this.drawVideoCall();
        else if (st === 'TASK_CHOICE') {
            this.drawWorld();
            this.ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
            this.ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
        }
        else if (st === 'SHIFT_BREAK') this.drawShiftBreak();
        else if (st === 'GAMEOVER') this.drawGameOver();
        else if (st === 'CONNECTING_CALL' || st === 'LOADING' || st === 'LOADING_TASK' || st === 'LOADING_QUIZ') {
            this.drawLoading(
                st === 'CONNECTING_CALL' ? this.game.getLine('CONNECTING') :
                st === 'LOADING_QUIZ' ? this.game.getLine('LOADING_QUIZ') : this.game.getLine('LOADING')
            );
        } else {
            this.drawWorld();
            if (st !== 'TYPING_TASK' && st !== 'TASK_CHOICE') {
                this.drawHUD();
                this.drawPhone();
                if (this.game.shop.active) this.drawShop();
            }
        }

        this.drawStressVignette();
        this.drawScanlines();
        this.ctx.restore();
    }

    drawStressVignette() {
        const stressPct = this.game.stress / this.game.maxStress;
        if (stressPct <= 0.45) return;
        const a = (stressPct - 0.45) * 0.55;
        const grad = this.ctx.createRadialGradient(CONFIG.W / 2, CONFIG.H / 2, CONFIG.H * 0.2, CONFIG.W / 2, CONFIG.H / 2, CONFIG.H * 0.75);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(127, 29, 29, ${a})`);
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
    }

    drawScanlines() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.06)';
        for (let y = Math.floor(this.scanPhase) % 3; y < CONFIG.H; y += 3) {
            this.ctx.fillRect(0, y, CONFIG.W, 1);
        }
    }

    drawWorld() {
        this.ctx.save();
        this.ctx.translate(-Math.floor(this.game.camera.x), -Math.floor(this.game.camera.y));

        const building = this.game.building;
        if (!building?.floors) {
            this.ctx.restore();
            return;
        }

        const f = building.floors[this.game.player.z];
        if (!f?.map) {
            this.ctx.restore();
            return;
        }

        const tSize = CONFIG.TILE;
        const startX = Math.max(0, Math.floor(this.game.camera.x / tSize) - 1);
        const startY = Math.max(0, Math.floor(this.game.camera.y / tSize) - 1);
        const endX = Math.min(f.map[0].length, startX + Math.ceil(CONFIG.W / tSize) + 3);
        const endY = Math.min(f.map.length, startY + Math.ceil(CONFIG.H / tSize) + 3);
        const tiles = this.game.sprites.tiles;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const t = f.map[y][x];
                const sx = Math.min(t, 13) * 16;
                this.ctx.drawImage(tiles, sx, 0, 16, 16, x * tSize, y * tSize, tSize, tSize);
            }
        }

        this.drawStairEffects(f, startX, startY, endX, endY, tSize);

        const sorted = [...(f.npcs || [])].sort((a, b) => a.vy - b.vy);
        sorted.forEach(npc => {
            if (npc.vx < this.game.camera.x - 40 || npc.vx > this.game.camera.x + CONFIG.W + 20) return;

            const bob = Math.sin(this.game.frame * 0.18 + npc.x) * 1.5;
            const sprite = this.game.getHumanSprite(npc.shirt || '#64748b', npc.hair || '#1e293b', npc.isVendor);

            this.ctx.fillStyle = 'rgba(0,0,0,0.28)';
            this.ctx.beginPath();
            this.ctx.ellipse(npc.vx + 8, npc.vy + 14, 5, 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.drawImage(sprite, npc.vx, npc.vy + bob);

            if (npc === this.game.phone.targetNPC) {
                this.drawCallMarker(npc.vx, npc.vy);
            } else if (npc.isVendor) {
                this.ctx.fillStyle = '#facc15';
                this.ctx.font = '6px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('$', npc.vx + 8, npc.vy - 2);
                this.ctx.textAlign = 'left';
            }
        });

        this.game.particles.particles.forEach(p => {
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        this.ctx.globalAlpha = 1;

        this.ctx.font = 'bold 9px monospace';
        this.game.floatingTexts.texts.forEach(t => {
            this.ctx.globalAlpha = Math.max(0, t.life);
            this.ctx.fillStyle = t.color;
            this.ctx.fillText(t.text, t.x, t.y);
        });
        this.ctx.globalAlpha = 1;

        const moving = Math.abs(this.game.player.vx - this.game.player.x * CONFIG.TILE) > 0.5 ||
            Math.abs(this.game.player.vy - this.game.player.y * CONFIG.TILE) > 0.5;
        if (moving) this.heroWalkFrame++;

        const hero = moving && this.heroWalkFrame % 12 < 6
            ? (this.game.sprites.heroWalk || this.game.sprites.hero)
            : this.game.sprites.hero;

        this.ctx.fillStyle = 'rgba(0,0,0,0.28)';
        this.ctx.beginPath();
        this.ctx.ellipse(this.game.player.vx + 8, this.game.player.vy + 14, 5, 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.drawImage(hero, this.game.player.vx, this.game.player.vy);

        this.ctx.restore();
    }

    drawCallMarker(x, y) {
        const pulse = 0.65 + Math.sin(this.game.frame * 0.22) * 0.35;
        const floatY = Math.sin(this.game.frame * 0.28) * 3;
        this.ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
        this.ctx.fillRect(x + 1, y - 18 + floatY, 14, 14);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 1, y - 18 + floatY, 14, 14);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 10px monospace';
        this.ctx.fillText('!', x + 6, y - 7 + floatY);
    }

    drawStairEffects(f, startX, startY, endX, endY, tSize) {
        const ctx = this.ctx;
        const px = this.game.player.x;
        const py = this.game.player.y;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const t = f.map[y]?.[x];
                if (t !== STAIR_UP && t !== STAIR_DOWN) continue;

                const tx = x * tSize;
                const ty = y * tSize;
                const pulse = 0.45 + Math.sin(this.game.frame * 0.14) * 0.35;
                const isUp = t === STAIR_UP;

                ctx.strokeStyle = isUp ? `rgba(74, 222, 128, ${pulse})` : `rgba(56, 189, 248, ${pulse})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(tx + 0.5, ty + 0.5, tSize - 1, tSize - 1);

                const dist = Math.abs(px - x) + Math.abs(py - y);
                if (dist <= 1) {
                    const bob = Math.sin(this.game.frame * 0.2) * 2;
                    ctx.fillStyle = isUp ? 'rgba(74, 222, 128, 0.92)' : 'rgba(56, 189, 248, 0.92)';
                    ctx.font = 'bold 6px monospace';
                    ctx.textAlign = 'center';
                    const hint = isUp ? this.game.getLine('STAIR_HINT_UP') : this.game.getLine('STAIR_HINT_DOWN');
                    ctx.fillText(hint, tx + tSize / 2, ty - 3 + bob);
                    ctx.textAlign = 'left';
                }
            }
        }
    }

    drawHUD() {
        const ctx = this.ctx;

        /* ─── Top status bar (24px) ─────────────────────────────────── */
        const HUD_H = 24;
        ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
        ctx.fillRect(0, 0, CONFIG.W, HUD_H);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, HUD_H + 0.5);
        ctx.lineTo(CONFIG.W, HUD_H + 0.5);
        ctx.stroke();

        /* Money — left side. */
        ctx.font = 'bold 10px monospace';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#facc15';
        ctx.fillText('$', 6, HUD_H / 2);
        ctx.fillStyle = '#fff';
        ctx.fillText(String(this.game.money).padStart(4, ' '), 14, HUD_H / 2);

        /* Stress bar — center-left. Compact: bar + small label. */
        const stressPct = this.game.stress / this.game.maxStress;
        const stressColor = stressPct > 0.75 ? Palette.stress_high
            : stressPct > 0.45 ? Palette.stress_med
            : Palette.stress_low;
        const stressX = 56, stressY = 8, stressW = 60;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(stressX, stressY, stressW, 8);
        ctx.fillStyle = stressColor;
        ctx.fillRect(stressX + 1, stressY + 1, Math.max(0, (stressW - 2) * Math.min(1, stressPct)), 6);
        ctx.font = '6px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(this.game.getLine('STRESS'), stressX + 1, stressY - 3);

        /* Clock + shift counter — center. Right-aligned at a fixed anchor
           so it never collides with the floor panel. */
        const framesLeft = Math.max(0, CONFIG.SHIFT_DURATION - this.game.shiftTimer);
        const timeStr = formatShiftTime(framesLeft);
        const urgent = framesLeft < CONFIG.FPS_ASSUME * 45;
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = urgent ? '#ef4444' : '#22d3ee';
        ctx.fillText('⏱', 124, HUD_H / 2);
        ctx.fillStyle = urgent ? '#fca5a5' : '#ffffff';
        ctx.fillText(timeStr, 138, HUD_H / 2);
        ctx.fillStyle = '#64748b';
        ctx.font = '6px monospace';
        ctx.fillText(`${this.game.getLine('SHIFT_LABEL')} ${this.game.shiftNumber}`, 168, HUD_H / 2);

        if (this.game.staticMode) {
            ctx.fillStyle = 'rgba(34, 211, 238, 0.18)';
            ctx.fillRect(200, 4, 36, 16);
            ctx.strokeStyle = '#22d3ee';
            ctx.strokeRect(200.5, 4.5, 35, 15);
            ctx.fillStyle = '#22d3ee';
            ctx.font = '6px monospace';
            ctx.fillText('STATIC', 204, HUD_H / 2);
        }

        ctx.textBaseline = 'alphabetic';

        /* ─── Right-side floor panel ────────────────────────────────── */
        const panelW = 48;
        const panelX = CONFIG.W - panelW;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.fillRect(panelX, HUD_H, panelW, CONFIG.H - HUD_H);
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(panelX + 0.5, HUD_H);
        ctx.lineTo(panelX + 0.5, CONFIG.H);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = '7px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('FLOORS', panelX + panelW / 2, HUD_H + 10);

        const targetFloor = this.getTargetFloorIndex();
        if (this.game.building?.floors) {
            const floors = this.game.building.floors;
            for (let i = floors.length - 1; i >= 0; i--) {
                const y = HUD_H + 22 + ((floors.length - 1 - i) * 18);
                const active = this.game.player.z === i;
                const isTarget = targetFloor === i;
                if (active) {
                    ctx.fillStyle = Palette.text;
                    ctx.fillRect(panelX + 3, y - 7, panelW - 6, 14);
                    ctx.fillStyle = '#0f172a';
                } else if (isTarget) {
                    const pulse = 0.4 + Math.sin(this.game.frame * 0.18) * 0.3;
                    ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
                    ctx.fillRect(panelX + 3, y - 7, panelW - 6, 14);
                    ctx.fillStyle = '#fee2e2';
                } else {
                    ctx.fillStyle = '#64748b';
                }
                let label = floors[i].name || `F${i}`;
                if (label.length > 7) label = label.slice(0, 6) + '…';
                ctx.font = active ? 'bold 7px monospace' : '7px monospace';
                ctx.fillText(label, panelX + panelW / 2, y + 2);
                if (isTarget && !active) {
                    ctx.fillStyle = '#ef4444';
                    ctx.fillText('►', panelX + 6, y + 2);
                }
            }
        }
        ctx.textAlign = 'left';

        /* ─── Objective banner (under HUD, above floor panel) ───────── */
        if (this.game.phone.targetNPC) {
            this.drawObjectiveBanner(panelX);
        }

        /* ─── Bottom message log ────────────────────────────────────── */
        if (this.game.msg.timer > 0) {
            this.game.msg.timer--;
            const boxH = 36;
            const boxW = panelX - 8;
            const boxX = 4;
            const boxY = CONFIG.H - boxH - 4;
            ctx.fillStyle = 'rgba(0,0,0,0.88)';
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = '#334155';
            ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
            ctx.fillStyle = '#facc15';
            ctx.textAlign = 'center';
            ctx.font = '8px monospace';
            const lines = this.game.msg.text.split('\n');
            const startY = boxY + boxH / 2 - ((lines.length - 1) * 5);
            lines.forEach((line, i) => {
                this.wrapText(line, boxX + boxW / 2, startY + i * 10, boxW - 16, 10);
            });
            ctx.textAlign = 'left';
        }
    }

    getTargetFloorIndex() {
        const npc = this.game.phone.targetNPC;
        if (!npc || !this.game.building?.floors) return -1;
        for (let i = 0; i < this.game.building.floors.length; i++) {
            const fl = this.game.building.floors[i];
            if (fl.npcs?.includes(npc)) return i;
        }
        return -1;
    }

    drawObjectiveBanner(panelX) {
        const ctx = this.ctx;
        const floorName = this.game.phone.floorName || '?';
        const HUD_H = 24;
        const bx = 240;
        const by = HUD_H + 2;
        const bw = (panelX || (CONFIG.W - 48)) - bx - 4;
        const bh = 12;
        const pulse = 0.55 + Math.sin(this.game.frame * 0.18) * 0.35;
        ctx.fillStyle = `rgba(239, 68, 68, ${pulse * 0.45})`;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.game.getLine('OBJECTIVE', { floor: floorName }), bx + bw / 2, by + bh / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    drawBar(x, y, w, pct, label, color) {
        const ctx = this.ctx;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, w, 8);
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * Math.min(1, pct)), 6);
        ctx.fillStyle = '#64748b';
        ctx.font = '6px monospace';
        ctx.fillText(label, x, y + 16);
    }

    drawPhone() {
        /* Two visual modes:
           - phone.ringing: big animated card in the upper-center of the
             screen with a wiggling phone, "INCOMING REQUEST" header,
             caller info, topic, dismiss hint. Slides in, vibrates.
           - phone.targetNPC && !ringing: small pinned reminder near the
             top-right of the play area (under the HUD) that lets the
             player keep their bearings while moving toward the NPC.
           In neither mode is gameplay blocked; the apprentice's "!" tag
           is the actual interaction trigger. */
        if (this.game.shop.active) return;
        if (this.game.phone.ringing) {
            this.drawIncomingCallCard();
            return;
        }
        if (this.game.phone.targetNPC) {
            this.drawCallMutedHint();
        }
    }

    drawIncomingCallCard() {
        const ctx = this.ctx;
        const game = this.game;
        const ringTotal = Math.max(1, game.phone.ringTotal || 1);
        const elapsed = ringTotal - game.phone.ringTimer;
        /* Slide-in over the first ~14 frames, then settle. */
        const slide = Math.min(1, elapsed / 14);
        const easeOut = 1 - Math.pow(1 - slide, 3);
        /* Width fits between left edge (with margin) and the floor panel. */
        const PANEL_W = 48;
        const w = Math.min(220, CONFIG.W - PANEL_W - 12);
        const h = 70;
        const x = ((CONFIG.W - PANEL_W) - w) / 2 + 4;
        const y = 30 + (1 - easeOut) * -40;

        /* Subtle wiggle to mimic a vibrating phone. */
        const wiggle = Math.sin(game.frame * 0.9) * 1.4;

        ctx.save();
        ctx.translate(x + wiggle, y);

        /* Soft drop shadow. */
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(2, 4, w, h);

        /* Card background. */
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        const pulse = 0.55 + Math.sin(game.frame * 0.32) * 0.45;
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, w - 2, h - 2);

        /* Pixel-art phone icon at the left. */
        this.drawPhoneIcon(8, 12, pulse);

        /* Title row — "INCOMING REQUEST". */
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(game.getLine('CALL_INCOMING'), 38, 18);

        /* Pulsing "RIIING..." text. */
        ctx.fillStyle = `rgba(252, 165, 165, ${0.5 + pulse * 0.5})`;
        ctx.font = '7px monospace';
        ctx.fillText(game.getLine('CALL_RING'), 38, 28);

        /* Floor + topic info. */
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(game.getLine('CALL_FLOOR', { floor: game.phone.floorName || '?' }), 38, 42);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '7px monospace';
        const topic = (game.phone.topic || '').slice(0, 24);
        ctx.fillText(game.getLine('CALL_TOPIC', { topic }), 38, 52);

        /* Bottom hint row. */
        ctx.fillStyle = '#fde68a';
        ctx.font = '6px monospace';
        ctx.fillText(game.getLine('CALL_HOW_TO'), 4, h - 4);
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'right';
        ctx.fillText(game.getLine('CALL_DISMISS'), w - 4, h - 4);
        ctx.textAlign = 'left';

        /* Tiny progress bar showing how much "ring time" remains so the
           player knows the loud alert will end on its own. */
        const pct = game.phone.ringTimer / ringTotal;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(4, h - 14, w - 8, 2);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(4, h - 14, (w - 8) * Math.max(0, Math.min(1, pct)), 2);

        ctx.restore();
    }

    drawPhoneIcon(x, y, pulse) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        /* Subtle shake while ringing. */
        ctx.rotate(Math.sin(this.game.frame * 0.6) * 0.08);
        /* Receiver body. */
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(0, 4, 6, 14);
        ctx.fillRect(14, 4, 6, 14);
        ctx.fillRect(2, 0, 16, 6);
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(0, 14, 6, 4);
        ctx.fillRect(14, 14, 6, 4);
        /* Handle highlight. */
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(2, 1, 14, 2);
        /* Sound waves blinking. */
        ctx.strokeStyle = `rgba(252, 211, 77, ${pulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(10, 9, 12, -0.5, -2.7, true);
        ctx.stroke();
        ctx.restore();
    }

    drawCallMutedHint() {
        const ctx = this.ctx;
        const HUD_H = 24;
        const panelW = 48;
        const w = 110, h = 22;
        const x = CONFIG.W - panelW - w - 6;
        const y = HUD_H + 18;

        const pulse = 0.5 + Math.sin(this.game.frame * 0.18) * 0.3;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('!', x + 6, y + 10);
        ctx.fillStyle = '#fee2e2';
        ctx.fillText(this.game.getLine('CALL_FLOOR', { floor: this.game.phone.floorName || '?' }), x + 14, y + 10);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '6px monospace';
        const topic = (this.game.phone.topic || '').slice(0, 18);
        ctx.fillText(topic, x + 14, y + 18);
    }

    drawBriefing() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0f1a';
        ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

        ctx.fillStyle = 'rgba(34, 211, 238, 0.12)';
        ctx.fillRect(0, 0, CONFIG.W, 20);
        ctx.fillStyle = '#22d3ee';
        ctx.font = '7px monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${this.game.getLine('BRIEF_LABEL')} · IRIS`, 8, 10);
        ctx.textBaseline = 'alphabetic';

        const portraitW = 56, portraitH = 56;
        const portraitX = 14;
        const portraitY = 30;
        const bob = Math.sin(this.game.frame * 0.07) * 1.5;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(portraitX - 2, portraitY - 2, portraitW + 4, portraitH + 4);
        ctx.strokeStyle = '#475569';
        ctx.strokeRect(portraitX - 1.5, portraitY - 1.5, portraitW + 3, portraitH + 3);
        ctx.save();
        ctx.translate(portraitX + portraitW / 2, portraitY + bob);
        ctx.scale(portraitW / 64, portraitH / 64);
        ctx.drawImage(this.game.sprites.recruiter, -32, 0);
        ctx.restore();

        const recOn = Math.floor(this.game.frame / 18) % 2 === 0;
        ctx.fillStyle = recOn ? '#ef4444' : '#7f1d1d';
        ctx.beginPath();
        ctx.arc(portraitX + 6, portraitY + 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '6px monospace';
        ctx.fillText('LIVE', portraitX + 12, portraitY + 8);

        /* Speech bubble: roomy, with a small tail pointing back at Iris. */
        const bubbleX = portraitX + portraitW + 12;
        const bubbleY = 30;
        const bubbleW = CONFIG.W - bubbleX - 12;
        const bubbleH = 110;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1;
        ctx.strokeRect(bubbleX + 0.5, bubbleY + 0.5, bubbleW - 1, bubbleH - 1);
        ctx.beginPath();
        ctx.moveTo(bubbleX, bubbleY + 18);
        ctx.lineTo(bubbleX - 6, bubbleY + 24);
        ctx.lineTo(bubbleX, bubbleY + 30);
        ctx.closePath();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fill();
        ctx.strokeStyle = '#22d3ee';
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        const line = this.game.getBriefingLine();
        this.wrapText(line, bubbleX + 10, bubbleY + 18, bubbleW - 20, 12);

        if (this.game.briefingTyping && Math.floor(this.game.frame / 12) % 2 === 0) {
            ctx.fillStyle = '#22d3ee';
            ctx.fillRect(bubbleX + bubbleW - 12, bubbleY + bubbleH - 14, 4, 8);
        }

        /* Progress dots — centered horizontally below the bubble. */
        const dotsY = bubbleY + bubbleH + 12;
        this.drawProgressDots(this.game.briefingLines.length, this.game.briefingIndex, dotsY);

        /* Continue hint or skip bar at the bottom. */
        if (this.bHoldVisible()) {
            this.drawSkipProgressBar();
        } else if (!this.game.briefingTyping && Math.floor(this.game.frame / 28) % 2 === 0) {
            ctx.font = '8px monospace';
            ctx.fillStyle = '#facc15';
            ctx.textAlign = 'center';
            ctx.fillText(this.game.getLine('BRIEF_HINT'), CONFIG.W / 2, CONFIG.H - 10);
            ctx.textAlign = 'left';
        } else {
            ctx.font = '7px monospace';
            ctx.fillStyle = '#475569';
            ctx.textAlign = 'center';
            ctx.fillText(this.game.getLine('SKIP_HINT_BAR'), CONFIG.W / 2, CONFIG.H - 10);
            ctx.textAlign = 'left';
        }
    }

    drawProgressDots(total, current, y) {
        const ctx = this.ctx;
        const spacing = 10;
        const totalW = total * spacing;
        for (let i = 0; i < total; i++) {
            ctx.fillStyle = i <= current ? '#22d3ee' : '#334155';
            ctx.beginPath();
            ctx.arc(CONFIG.W / 2 - totalW / 2 + spacing / 2 + i * spacing, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    bHoldVisible() {
        return this.game.bHoldFrames >= 4;
    }

    drawSkipProgressBar() {
        const ctx = this.ctx;
        const SKIP_HOLD_FRAMES = 30; /* mirrors game.js */
        const pct = Math.min(1, this.game.bHoldFrames / SKIP_HOLD_FRAMES);
        const w = 140, h = 6;
        const x = (CONFIG.W - w) / 2;
        const y = CONFIG.H - 16;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(x - 4, y - 10, w + 8, h + 14);
        ctx.fillStyle = '#facc15';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.game.getLine('SKIPPING'), CONFIG.W / 2, y - 2);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(x + 1, y + 1, (w - 2) * pct, h - 2);
        ctx.textAlign = 'left';
    }

    drawShop() {
        const w = 220, h = 150;
        const x = (CONFIG.W - w) / 2, y = (CONFIG.H - h) / 2;
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.97)';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = '#facc15';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.fillStyle = '#facc15';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.game.getLine('SHOP_TITLE'), x + w / 2, y + 18);
        this.ctx.font = '9px monospace';
        this.ctx.textAlign = 'left';
        let iy = y + 38;
        this.game.shop.items.forEach((item, i) => {
            const sel = i === this.game.shop.selected;
            this.ctx.fillStyle = sel ? 'rgba(250, 204, 21, 0.15)' : 'transparent';
            this.ctx.fillRect(x + 8, iy - 12, w - 16, 16);
            this.ctx.fillStyle = sel ? '#facc15' : '#e2e8f0';
            this.ctx.fillText((sel ? '▸ ' : '  ') + item.n, x + 14, iy);
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`$${item.cost}`, x + w - 14, iy);
            this.ctx.textAlign = 'left';
            iy += 20;
        });
        const selItem = this.game.shop.items[this.game.shop.selected];
        let effectText = this.game.getLine('EFFECT', { stress: selItem.stress });
        if (selItem.speed) effectText += this.game.getLine('SPEED_BONUS');
        this.ctx.fillStyle = Palette.text;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(effectText, x + w / 2, y + h - 28);
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fillText(`[A] ${this.game.getLine('BUY')}   [B] ${this.game.getLine('EXIT')}`, x + w / 2, y + h - 10);
        this.ctx.textAlign = 'left';
    }

    drawPrologue() {
        const ctx = this.ctx;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

        ctx.fillStyle = 'rgba(34, 211, 238, 0.12)';
        ctx.fillRect(0, 0, CONFIG.W, 20);
        ctx.fillStyle = '#22d3ee';
        ctx.font = '7px monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText('ARBORITO ACADEMY · BOOT SEQUENCE v5', 8, 10);
        ctx.textBaseline = 'alphabetic';

        /* Centered, monospace, wrapped. Reserve top 30px for header, bottom
           50px for dots + hint, so text body is ~80px tall — plenty for 3
           wrapped lines at 13px line-height. */
        const line = this.game.getPrologueLine();
        const isFirst = this.game.prologueIndex === 0;
        ctx.fillStyle = isFirst ? '#22d3ee' : '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.font = isFirst ? 'bold 10px monospace' : '9px monospace';
        const bodyTop = 60;
        const bodyW = CONFIG.W - 32;
        this.wrapText(line, CONFIG.W / 2, bodyTop, bodyW, 13);

        if (this.game.prologueTyping && Math.floor(this.game.frame / 12) % 2 === 0) {
            const m = ctx.measureText(line);
            ctx.fillStyle = '#22d3ee';
            ctx.fillRect(CONFIG.W / 2 + Math.min(m.width, bodyW) / 2 + 3, bodyTop - 8, 4, 10);
        }

        /* Progress dots. */
        const dotY = CONFIG.H - 38;
        this.drawProgressDots(this.game.prologueLines.length, this.game.prologueIndex, dotY);

        /* Continue hint or skip bar at the bottom. */
        if (this.bHoldVisible()) {
            this.drawSkipProgressBar();
        } else if (!this.game.prologueTyping && Math.floor(this.game.frame / 28) % 2 === 0) {
            ctx.font = '8px monospace';
            ctx.fillStyle = '#facc15';
            ctx.fillText(this.game.getLine('BRIEF_HINT'), CONFIG.W / 2, CONFIG.H - 16);
        } else {
            ctx.font = '7px monospace';
            ctx.fillStyle = '#475569';
            ctx.fillText(this.game.getLine('SKIP_HINT_BAR'), CONFIG.W / 2, CONFIG.H - 16);
        }
        ctx.textAlign = 'left';
    }

    drawVideoCall() {
        const st = this.game.state;
        const choiceOpen = this.game.els.choiceLayer?.classList.contains('active');

        this.ctx.fillStyle = '#0a0f1a';
        this.ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

        const videoH = choiceOpen ? 72 : 128;
        const videoY = choiceOpen ? 8 : 14;

        this.ctx.shadowColor = '#22d3ee';
        this.ctx.shadowBlur = choiceOpen ? 4 : 12;
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(24, videoY, CONFIG.W - 48, videoH);
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#475569';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(24, videoY, CONFIG.W - 48, videoH);

        const faceScale = choiceOpen ? 0.55 : 1;
        const faceX = CONFIG.W / 2 - 32 * faceScale;
        const faceY = videoY + (choiceOpen ? 6 : 24);
        const bob = Math.sin(this.game.frame * 0.07) * (choiceOpen ? 1 : 2);

        this.ctx.save();
        this.ctx.translate(faceX + 32 * faceScale, faceY + bob);
        this.ctx.scale(faceScale, faceScale);
        this.ctx.drawImage(this.game.sprites.recruiter, -32, 0);
        this.ctx.restore();

        const recOn = Math.floor(this.game.frame / 18) % 2 === 0;
        this.ctx.fillStyle = recOn ? '#ef4444' : '#7f1d1d';
        this.ctx.beginPath();
        this.ctx.arc(36, videoY + 10, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '7px monospace';
        this.ctx.fillText('REC', 44, videoY + 13);
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fillText(`${this.game.data.company.toUpperCase()} · HR`, 36, videoY + videoH - 6);

        const cx = CONFIG.W / 2;

        if (st === 'INTERVIEW_FEEDBACK') {
            this.ctx.fillStyle = '#facc15';
            this.ctx.textAlign = 'center';
            this.ctx.font = '9px monospace';
            this.wrapText(this.game.lastInterviewFeedback || '', cx, 168, CONFIG.W - 28, 11);
            if (Math.floor(this.game.frame / 28) % 2 === 0) {
                this.ctx.fillStyle = '#fff';
                this.ctx.fillText(`[${this.game.getLine('PRESS_A')}]`, cx, 210);
            }
        }
        this.ctx.textAlign = 'left';
    }

    drawLoading(text) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
        const cx = CONFIG.W / 2, cy = CONFIG.H / 2 - 12;
        const t = this.game.frame * 0.12;
        this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.strokeStyle = Palette.text;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 24, t, t + 1.6);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 15, -t * 1.2, -t * 1.2 + 1.1);
        this.ctx.stroke();
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, cx, cy + 44);
        this.ctx.textAlign = 'left';
    }

    drawShiftBreak() {
        this.drawWorld();
        this.ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
        this.ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

        if (this.game.frame % 10 === 0) {
            this.game.particles.spawn(CONFIG.W / 2 + (Math.random() - 0.5) * 60, 50, '#38bdf8', 2, { upward: true });
        }

        const cx = CONFIG.W / 2;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#4ade80';
        this.ctx.font = 'bold 13px monospace';
        this.ctx.fillText(this.game.getLine('SHIFT_BREAK_TITLE', { num: this.game.shiftNumber }), cx, 44);

        this.ctx.fillStyle = '#e2e8f0';
        this.ctx.font = '8px monospace';
        const body = this.game.getLine('SHIFT_BREAK_BODY', {
            tickets: this.game.lastShiftTickets,
            amount: this.game.lastShiftEarned,
            total: this.game.money
        });
        body.split('\n').forEach((line, i) => {
            this.wrapText(line, cx, 70 + i * 12, CONFIG.W - 32, 12);
        });

        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '7px monospace';
        this.ctx.fillText(
            `${this.game.lang === 'ES' ? 'Total ayudados' : 'Total mentored'}: ${this.game.tasksSolved} · $${this.game.score}`,
            cx, 130
        );

        if (Math.floor(this.game.frame / 28) % 2 === 0) {
            this.ctx.fillStyle = '#facc15';
            this.ctx.font = 'bold 9px monospace';
            this.ctx.fillText(`[A] ${this.game.getLine('NEXT_SHIFT', { num: this.game.shiftNumber + 1 })}`, cx, CONFIG.H - 24);
        }
        this.ctx.textAlign = 'left';
    }

    drawGameOver() {
        const isWin = /SHIFT|TURNO|COMPLET/i.test(this.game.msg.text);
        this.ctx.fillStyle = isWin ? '#0c4a6e' : '#450a0a';
        this.ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

        if (isWin && this.game.frame % 8 === 0) {
            this.game.particles.spawn(CONFIG.W / 2 + (Math.random() - 0.5) * 80, CONFIG.H / 2 - 20, ['#38bdf8', '#facc15', '#4ade80'][Math.floor(Math.random() * 3)], 2, { upward: true });
        }

        const cx = CONFIG.W / 2;
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.fillText(isWin ? this.game.getLine('SHIFT_COMPLETE') : this.game.getLine('GAME_OVER'), cx, 50);

        this.ctx.font = '9px monospace';
        this.ctx.fillStyle = isWin ? '#bae6fd' : '#fca5a5';
        const msgLines = this.game.msg.text.split('\n');
        msgLines.forEach((line, i) => {
            if (i > 0) this.wrapText(line, cx, 78 + (i - 1) * 12, CONFIG.W - 32, 12);
        });

        this.ctx.fillStyle = '#facc15';
        this.ctx.font = 'bold 10px monospace';
        this.ctx.fillText(`$${this.game.score}`, cx, CONFIG.H / 2 + 28);
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '8px monospace';
        this.ctx.fillText(
            `${this.game.lang === 'ES' ? 'Aprendices' : 'Mentored'}: ${this.game.tasksSolved}`,
            cx, CONFIG.H / 2 + 42
        );

        if (Math.floor(this.game.frame / 28) % 2 === 0) {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(this.game.getLine('RESTART'), cx, CONFIG.H - 18);
        }
        this.ctx.textAlign = 'left';
    }

    wrapText(text, x, y, maxWidth, lineHeight) {
        const words = String(text).split(' ');
        let line = '';
        let ly = y;
        for (const word of words) {
            const test = line + word + ' ';
            if (this.ctx.measureText(test).width > maxWidth && line) {
                this.ctx.fillText(line.trim(), x, ly);
                line = word + ' ';
                ly += lineHeight;
            } else {
                line = test;
            }
        }
        if (line.trim()) this.ctx.fillText(line.trim(), x, ly);
    }
}
