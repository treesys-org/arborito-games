import { SeededRandom, rectIntersect, Sprites, bindMobileTap } from './utils.js';

const BOSS_NAMES = ['Eco del Vacío', 'Sombra Primordial', 'Cantor del Olvido'];

const SPEAKER_NAMES = {
    elder: 'Anciano Marciano',
    scholar: 'Erudito Marciano',
    beacon_npc: 'Técnico Marciano'
};

const SCHOLAR_LINES = [
    'Las Sombras robaron nuestros cristales de saber. Sin ellos, olvidamos lo esencial.',
    'He visto sombras moverse entre las rocas... evítalas o destrúyelas con tu bláster.',
    'El Anciano te espera cerca de la nave. Él conoce la historia de este mundo.',
    'Cada cristal que recuperes devuelve una parte de nuestra memoria colectiva.',
    'Los Sabios guardaron el conocimiento en resonancia cristalina. No dejes que el Vacío lo devore.'
];

/** Strip backend tags (@quiz blocks, @-meta), markdown, code fences and other author markup
 *  so on-planet NPC dialogue reads as natural prose, not a debug dump. */
function sanitizeLessonText(raw) {
    let s = String(raw || '');
    s = s.replace(/^@quiz\s*\n[\s\S]*?^@\/quiz\s*$/gim, ' ');
    s = s.replace(/<[^>]*>/g, ' ');
    s = s.replace(/```[\s\S]*?```/g, ' ');
    s = s.replace(/`[^`]*`/g, ' ');
    s = s.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1');
    s = s.replace(/@[A-Za-z_][\w-]*/g, ' ');
    s = s.replace(/\{[^}]*\}/g, ' ');
    s = s.replace(/[#*_>~|`]/g, ' ');
    s = s.replace(/https?:\/\/\S+/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
}

/** Find a self-contained sentence between minLen..maxLen characters that
 *  actually reads like a sentence (letters + word count > 4). */
function pickSentence(text, { min = 24, max = 140 } = {}) {
    const clean = sanitizeLessonText(text);
    if (!clean) return '';
    const sentences = clean.split(/(?<=[.!?])\s+/);
    for (const raw of sentences) {
        const s = raw.trim().replace(/[.!?]+$/, '').trim();
        if (s.length < min || s.length > max) continue;
        if (!/[a-záéíóúñü]/i.test(s)) continue;
        if (s.split(/\s+/).length < 5) continue;
        return s;
    }
    return '';
}

function buildElderGreeting(title, lessonText) {
    const snippet = pickSentence(lessonText, { min: 24, max: 110 });
    const topic = snippet ? ` sobre "${snippet}"` : '';
    return `¡Viajero de las estrellas! Las Sombras del Coro del Vacío han robado los Cristales de Datos${topic}. ` +
        `Recupera 3 fragmentos, derrota al Eco del Vacío y regresa a tu nave. ¡Nuestro pueblo depende de ti!`;
}

function buildScholarLine(sentences, index, title) {
    if (sentences.length > 0) {
        const raw = sanitizeLessonText(sentences[index % sentences.length]);
        const trimmed = raw.replace(/[.!?]+$/, '').trim();
        if (trimmed.length >= 24 && trimmed.length <= 140 && trimmed.split(/\s+/).length >= 5) {
            return `En este mundo aprendimos: ${trimmed}.`;
        }
    }
    return SCHOLAR_LINES[index % SCHOLAR_LINES.length];
}

/** Append hex alpha to #rgb/#rrggbb; convert hsl() to hsla(). */
function withAlpha(color, hexAlpha) {
    if (!color) return '#000000' + hexAlpha;
    if (color.startsWith('#')) {
        return color.length > 7 ? color : color + hexAlpha;
    }
    if (color.startsWith('hsl(')) {
        const val = parseInt(hexAlpha, 16) / 255;
        return color.replace('hsl', 'hsla').replace(')', `, ${val.toFixed(2)})`);
    }
    return color;
}

export class PlatformerEngine {
    constructor(game) {
        this.game = game;
        this.player = {
            x: 100, y: 0, w: 32, h: 48,
            vx: 0, vy: 0,
            grounded: false,
            health: 100, maxHealth: 100,
            ammo: 0,
            facing: 1,
            animFrame: 0,
            state: 'idle'
        };
        this.camera = { x: 0, y: 0 };
        this.zoom = 2.0;

        this.tiles = [];
        this.npcs = [];
        this.enemies = [];
        this.props = [];
        this.projectiles = [];
        this.shipObj = null;

        this.levelWidth = 0;
        this.tileSize = 48;

        this.gravity = 0.8;
        this.moveSpeed = 6.0;
        this.jumpForce = -15;

        this.ui = {
            layer: document.getElementById('ui-planet'),
            dialogueBox: document.getElementById('dialogue-box'),
            dialogueText: document.getElementById('dialogue-text'),
            dialogueSpeaker: document.getElementById('dialogue-speaker'),
            healthFill: document.getElementById('health-fill'),
            ammoDisplay: document.getElementById('ammo-display'),
            deathScreen: document.getElementById('death-screen'),
            btnInteract: document.getElementById('btn-interact')
        };

        this.isLoading = false;
        this.bindTouchControls();

        this.dialogueQueue = [];
        this.activeDialogue = null;
        this.interactingNPC = null;
        this.crystals = [];
        this.crystalsCollected = 0;
        this.crystalsRequired = 3;
        this.boss = null;
        this.bossDefeated = false;
        this.levelComplete = false;

        this.theme = { ground: '#334155', sky: '#0f172a', bgMount: '#1e293b' };
    }

    bindTouchControls() {
        const bind = (id, key) => {
            const el = document.getElementById(id);
            if(!el) return;

            const handleStart = (e) => {
                e.preventDefault();
                this.game.input.setKey(key, true);
                el.style.opacity = '1';
                el.style.transform = 'scale(0.95)';
            };

            const handleEnd = (e) => {
                e.preventDefault();
                this.game.input.setKey(key, false);
                el.style.opacity = '0.6';
                el.style.transform = 'scale(1)';
            };

            el.addEventListener('touchstart', handleStart);
            el.addEventListener('touchend', handleEnd);
            el.addEventListener('touchcancel', handleEnd);
            el.addEventListener('mousedown', handleStart);
            el.addEventListener('mouseup', handleEnd);
            el.addEventListener('mouseleave', handleEnd);
        };

        bind('btn-left', 'ArrowLeft');
        bind('btn-right', 'ArrowRight');
        bind('btn-jump', 'ArrowUp');
        bind('btn-shoot', 'r');
        bind('btn-interact', 'ArrowUp');

        bindMobileTap(this.ui.dialogueBox, () => {
            if (!this.activeDialogue) return;
            this.activeDialogue = null;
            this.ui.dialogueBox.style.display = 'none';
        });
    }

    loadLevel(planet) {
        this.ui.layer.classList.remove('hidden');
        this.ui.deathScreen.classList.add('hidden');
        this.planet = planet;

        this.theme = {
            ground: planet.color || '#334155',
            sky: '#0f172a',
            bgMount: '#1e293b'
        };

        const fallbackData = {
            title: planet.data.title,
            text: 'Los Sabios Marcianos guardaron este conocimiento en cristales resonantes.'
        };

        this.generateWorld(fallbackData, {
            elder_greeting: buildElderGreeting(planet.data.title, planet.data.text || fallbackData.text)
        });

        if (window.arborito && window.arborito.lesson) {
            const idx = planet.data.index !== undefined ? planet.data.index : 0;
            window.arborito.lesson.at(idx).then(async (lessonData) => {
                const elderFallback = buildElderGreeting(lessonData.title, lessonData.text);
                let elderGreeting = elderFallback;

                const aiStatic = window.arborito.getAIMode && window.arborito.getAIMode() === 'static';
                if (aiStatic && lessonData.challenge) {
                    const c = lessonData.challenge;
                    const hint = c.short_definition || c.core_concept || '';
                    elderGreeting = buildElderGreeting(lessonData.title, hint || lessonData.text);
                } else {
                    try {
                        const prompt = `Planeta "${lessonData.title}". Lección: "${(lessonData.text || '').substring(0, 200)}".
Crea un diálogo RPG en ESPAÑOL para un Anciano Marciano desesperado.
Escenario: Sombras del Coro del Vacío robaron los Cristales de Datos.
El anciano pide ayuda al viajero: recuperar 3 cristales, derrotar al jefe, volver a la nave.
Menciona brevemente por qué este conocimiento es vital para su civilización.
Output JSON: { "elder_greeting": "..." }`;
                        const storyContext = await window.arborito.ask.json(prompt);
                        if (storyContext?.elder_greeting) elderGreeting = storyContext.elder_greeting;
                    } catch (e) {}
                }

                this.applyLessonDialogue(lessonData, elderGreeting);
            }).catch(e => {
                console.warn('arborito lesson load error', e);
            });
        }
    }

    applyLessonDialogue(data, elderGreeting) {
        const cleanText = sanitizeLessonText(data.text);
        const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
        let scholarIdx = 0;

        this.npcs.forEach(npc => {
            if (npc.type === 'elder') {
                npc.text = elderGreeting;
            } else if (npc.type === 'scholar') {
                npc.text = buildScholarLine(sentences, scholarIdx, data.title);
                scholarIdx++;
            }
        });
    }

    surfaceYAt(tileX) {
        if (!this.surfaceHeights) return 12 * this.tileSize;
        const col = Math.floor(tileX / this.tileSize);
        const clamped = Math.max(0, Math.min(this.surfaceHeights.length - 1, col));
        return this.surfaceHeights[clamped] * this.tileSize;
    }

    generateWorld(data, storyContext) {
        try {
            const rng = new SeededRandom(data.title);

            const cleanText = sanitizeLessonText(data.text);
            const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);

            this.tiles = [];
            this.tilesByCol = [];
            this.npcs = [];
            this.enemies = [];
            this.props = [];
            this.projectiles = [];
            this.activeDialogue = null;
            this.ui.dialogueBox.style.display = 'none';
            this.crystals = [];
            this.crystalsCollected = 0;
            this.bossDefeated = false;
            this.levelComplete = false;
            this.levelWidth = 5000;
            this.surfaceHeights = [];

            const groundY = 12;
            let height = groundY;
            let scholarCount = 0;
            const numCols = Math.floor(this.levelWidth / this.tileSize);

            for (let x = 0; x < numCols; x++) {
                if (x > 10 && x < numCols - 10) {
                    if (rng.next() > 0.7) height += rng.pick([-1, 0, 1]);
                }
                height = Math.max(8, Math.min(16, height));
                this.surfaceHeights[x] = height;

                for (let y = height; y < 20; y++) {
                    const type = y === height ? 'surface' : 'deep';
                    let deco = 0;
                    if (type === 'surface' && rng.next() > 0.5) deco = rng.pick([1, 2]);

                    this.tiles.push({
                        x: x*this.tileSize, y: y*this.tileSize,
                        w: this.tileSize, h: this.tileSize,
                        type: type,
                        deco: deco
                    });
                }

                const surfaceY = height * this.tileSize;

                if (x > 15 && x < (this.levelWidth/this.tileSize)-10 && rng.next() > 0.85) {
                    const py = height - rng.range(3, 5);
                    this.tiles.push({ x: x*this.tileSize, y: py*this.tileSize, w: this.tileSize, h: this.tileSize, type: 'plat' });
                }

                if (x > 15 && x < (this.levelWidth/this.tileSize)-10) {
                    const roll = rng.next();

                    if (roll > 0.92) {
                        this.props.push({
                            x: x * this.tileSize - 20,
                            y: surfaceY - 80,
                            type: 'hut',
                            w: 100, h: 80
                        });

                        const text = buildScholarLine(sentences, scholarCount, data.title);
                        this.npcs.push({
                            x: x*this.tileSize + 20, y: surfaceY - 48, w: 32, h: 48,
                            text: text,
                            type: 'scholar'
                        });
                        scholarCount++;
                    }
                    else if (roll < 0.15) {
                        this.enemies.push({
                            x: x*this.tileSize, y: surfaceY - 32, w: 32, h: 32,
                            vx: 0, vy: 0,
                            type: 'blob',
                            aggro: false,
                            startX: x*this.tileSize
                        });
                    }
                }
            }

            const spawnX = 220;
            const shipX = 100;
            const elderX = 350;
            const shipSurfaceY = this.surfaceYAt(shipX);
            const elderSurfaceY = this.surfaceYAt(elderX);
            const spawnSurfaceY = this.surfaceYAt(spawnX);

            this.shipObj = {
                x: shipX,
                y: shipSurfaceY - 64 + 10,
                w: 64, h: 64
            };

            const elderText = storyContext?.elder_greeting || buildElderGreeting(data.title, data.text);
            this.npcs.push({
                x: elderX,
                y: elderSurfaceY - 64,
                w: 32, h: 64,
                text: elderText,
                type: 'elder',
                questGiven: false
            });

            this.props.push({ x: elderX - 30, y: elderSurfaceY - 80, type: 'hut', w: 100, h: 80 });

            for (let c = 0; c < this.crystalsRequired; c++) {
                const cx = rng.range(800, this.levelWidth - 600);
                const cy = this.surfaceYAt(cx) - rng.range(48, 240);
                this.crystals.push({ x: cx, y: cy, w: 24, h: 28, collected: false });
            }

            const endX = this.levelWidth - 400;
            const endSurfaceY = this.surfaceYAt(endX);
            const bossY = endSurfaceY - 96;
            this.boss = {
                x: endX, y: bossY, w: 64, h: 64,
                hp: 150, maxHp: 150,
                vx: 0, vy: 0, grounded: false,
                name: BOSS_NAMES[rng.range(0, BOSS_NAMES.length) | 0],
                phase: 0, fireTimer: 0
            };

            const beaconX = endX + 120;
            const beaconNpcX = endX + 170;
            const beaconSurfaceY = this.surfaceYAt(beaconX);
            this.props.push({ x: beaconX, y: beaconSurfaceY - 100, type: 'beacon', w: 40, h: 100 });
            this.npcs.push({
                x: beaconNpcX,
                y: this.surfaceYAt(beaconNpcX) - 48,
                w: 32, h: 48,
                text: 'El Nexo está estabilizado. Pulsa [Z] en la nave para despegar.',
                type: 'beacon_npc'
            });

            this.player.x = spawnX;
            this.player.y = spawnSurfaceY - this.player.h;
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.health = 100;
            this.player.ammo = 10;
            this.player.state = 'idle';
            this.player.grounded = true;

            this.camera.x = this.player.x - (this.game.width / this.zoom / 2);
            this.camera.y = Math.min(this.player.y - (this.game.height / this.zoom / 2), 300);

            this.buildTileIndex();

            this.updateHUD();
            this.isLoading = false;
        } catch(e) {
            console.error("Critical World Gen Error", e);
            this.isLoading = false;
        }
    }

    /** Pre-bucket tiles by column so collision checks visit O(1) tiles
     *  per entity instead of O(N). With ~1200 tiles in a 5000px level,
     *  the player + boss + ~20 enemies were doing 25k tile iterations per
     *  frame; on planet that translated to noticeable frame drops. */
    buildTileIndex() {
        this.tilesByCol = [];
        for (const t of this.tiles) {
            const col = Math.floor(t.x / this.tileSize);
            if (!this.tilesByCol[col]) this.tilesByCol[col] = [];
            this.tilesByCol[col].push(t);
        }
    }

    /** Yield tiles whose column overlaps the AABB. */
    *nearbyTiles(ent) {
        if (!this.tilesByCol.length) {
            for (const t of this.tiles) yield t;
            return;
        }
        const startCol = Math.floor(ent.x / this.tileSize) - 1;
        const endCol = Math.floor((ent.x + ent.w) / this.tileSize) + 1;
        for (let c = startCol; c <= endCol; c++) {
            const bucket = this.tilesByCol[c];
            if (!bucket) continue;
            for (const t of bucket) yield t;
        }
    }

    update() {
        if (this.isLoading) return;

        if (this.player.health <= 0) return;

        if (this.activeDialogue) {
            if (this.game.input.consume('ArrowUp') || this.game.input.consume(' ') || this.game.input.consume('Enter')
                || this.game.input.consume('e') || this.game.input.consume('E')
                || this.game.input.consume('z') || this.game.input.consume('Z')) {
                this.activeDialogue = null;
                this.ui.dialogueBox.style.display = 'none';
            }
            return;
        }

        /* After completeLevel(), the post-victory story plays for ~1.5s before switching
           to space. Freeze input/physics so the player can't fall off a cliff, re-press Z,
           or otherwise corrupt state while the planet is still drawn. */
        if (this.levelComplete) {
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.state = 'idle';
            this.ui.btnInteract.style.display = 'none';
            return;
        }

        this.player.vx = 0;

        const k = this.game.input.keys;
        const pressingLeft = k['ArrowLeft'] || k['a'] || k['A'];
        const pressingRight = k['ArrowRight'] || k['d'] || k['D'];
        const pressingJump = k['ArrowUp'] || k[' '] || k['w'] || k['W'] || k['Spacebar'];

        if (pressingLeft) {
            this.player.vx = -this.moveSpeed;
            this.player.facing = -1;
            this.player.state = 'run';
        } else if (pressingRight) {
            this.player.vx = this.moveSpeed;
            this.player.facing = 1;
            this.player.state = 'run';
        } else {
            this.player.state = 'idle';
        }

        if (pressingJump && this.player.grounded) {
            this.player.vy = this.jumpForce;
            this.player.grounded = false;
            this.game.spawnParticle(this.player.x + 16, this.player.y + 48, '#fff', 3);
        }

        if (this.shipObj && Math.abs(this.player.x - this.shipObj.x) < 80 && Math.abs(this.player.y - this.shipObj.y) < 80) {
            if (this.game.input.consume('z') || this.game.input.consume('Z') || this.game.input.consume('Enter')) {
                if (this.bossDefeated) this.completeLevel();
                else this.showDialogue('E.D.E.N.', 'Aún queda energía hostil en el planeta. Derrota al jefe primero.');
            }
        }

        this.player.vy += this.gravity;

        if(this.player.vy > 18) this.player.vy = 18;

        this.player.x += this.player.vx;
        this.checkCol(true);

        this.player.y += this.player.vy;
        this.player.grounded = false;
        this.checkCol(false);

        if (!this.player.grounded) this.player.state = 'jump';
        this.player.animFrame++;

        if (this.game.input.consume('r') || this.game.input.consume('R') ||
            this.game.input.consume('z') || this.game.input.consume('Z') ||
            this.game.input.consume('j') || this.game.input.consume('J') ||
            this.game.input.consume('f') || this.game.input.consume('F')) this.shoot();

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            if (p.vy) p.y += p.vy;
            p.life--;
            if (p.life <= 0) { this.projectiles.splice(i, 1); continue; }

            if (this.boss && !this.bossDefeated && !p.enemy && rectIntersect({x: p.x, y: p.y, w: p.w, h: p.h}, this.boss)) {
                this.boss.hp -= 12;
                this.projectiles.splice(i, 1);
                this.game.spawnParticle(this.boss.x + 32, this.boss.y + 32, '#a78bfa', 8, 10);
                this.game.shake(6);
                if (this.boss.hp <= 0) this.defeatBoss();
                continue;
            }

            if (!p.enemy) for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (rectIntersect({x: p.x, y: p.y, w: p.w, h: p.h}, e)) {
                    this.enemies.splice(j, 1);
                    this.projectiles.splice(i, 1);
                    this.game.spawnParticle(e.x, e.y, '#ef4444', 6, 8);
                    this.game.shake(5);
                    break;
                }
            }

            if (p.enemy && rectIntersect({x: p.x, y: p.y, w: p.w, h: p.h}, this.player)) {
                this.damage(8);
                this.projectiles.splice(i, 1);
            }
        }

        this.crystals.forEach(c => {
            if (c.collected) return;
            if (rectIntersect(this.player, { x: c.x - 8, y: c.y - 8, w: c.w + 16, h: c.h + 16 })) {
                c.collected = true;
                this.crystalsCollected++;
                this.game.spawnParticle(c.x, c.y, '#22d3ee', 6, 8);
                this.player.ammo += 5;
                this.updateHUD();
                if (this.crystalsCollected >= this.crystalsRequired) {
                    this.showDialogue('E.D.E.N.', `¡${this.crystalsRequired} cristales recuperados! El jefe del Coro se manifiesta al final del sector.`);
                }
            }
        });

        if (this.boss && !this.bossDefeated) {
            this.updateBoss();
        }

        const camLeft = this.camera.x - 120;
        const camRight = this.camera.x + (this.game.width / this.zoom) + 120;
        this.enemies.forEach(e => {
            if (e.x + e.w < camLeft || e.x > camRight) {
                e.vx *= 0.95;
                return;
            }
            const dist = this.player.x - e.x;
            const distY = this.player.y - e.y;
            const range = 400;

            if (Math.abs(dist) < range) {
                e.aggro = true;
                const dir = Math.sign(dist);
                e.vx += dir * 0.2;
                e.vx = Math.max(-4, Math.min(4, e.vx));

                if (e.grounded && (Math.random() < 0.02 || (distY < -50 && Math.random() < 0.05))) {
                    e.vy = -12;
                    e.grounded = false;
                }
            } else {
                e.vx *= 0.9;
            }

            e.vy += this.gravity;
            e.x += e.vx;
            this.resolveEntityTilesX(e);

            e.y += e.vy;
            e.grounded = false;
            this.resolveEntityTilesY(e);

            if (rectIntersect(e, this.player)) {
                this.damage(10);
                this.player.vx = Math.sign(this.player.x - e.x) * 10;
                this.player.vy = -5;
                e.vx *= -1;
            }
        });

        const targetCamX = this.player.x - (this.game.width / this.zoom / 2);
        const targetCamY = this.player.y - (this.game.height / this.zoom / 2);
        const clampedTargetY = Math.min(targetCamY, 300);

        this.camera.x += (targetCamX - this.camera.x) * 0.1;
        this.camera.y += (clampedTargetY - this.camera.y) * 0.1;

        let nearby = null;
        let isShip = false;

        this.npcs.forEach(n => {
            if (Math.abs(this.player.x - n.x) < 60 && Math.abs(this.player.y - n.y) < 60) nearby = n;
        });

        if (this.shipObj && Math.abs(this.player.x - this.shipObj.x) < 80 && Math.abs(this.player.y - this.shipObj.y) < 80) {
            nearby = { type: 'ship' };
            isShip = true;
        }

        this.ui.btnInteract.style.display = (nearby && !isShip) ? 'flex' : 'none';

        const wantsInteract = this.game.input.consume('ArrowUp')
            || this.game.input.consume('Enter')
            || this.game.input.consume('e')
            || this.game.input.consume('E')
            || this.game.input.consume('w')
            || this.game.input.consume('W');
        if (nearby && wantsInteract) {
            if (isShip) {
            } else if (nearby.type === 'beacon_npc') {
                 if (this.bossDefeated) {
                     this.completeLevel();
                 } else {
                     this.showDialogue('E.D.E.N.', 'El Nexo está bloqueado. Derrota al jefe del Coro del Vacío primero.');
                 }
            } else {
                this.interactingNPC = nearby;
                if (nearby.type === 'scholar') {
                    this.player.ammo += 10;
                    this.game.spawnParticle(nearby.x, nearby.y, '#facc15', 5, 5);
                    this.updateHUD();
                }
                let text = nearby.text;
                let speaker = SPEAKER_NAMES[nearby.type] || nearby.type.toUpperCase();

                if (nearby.type === 'elder' && !nearby.questGiven) {
                    nearby.questGiven = true;
                    text += '\n\n[MISIÓN] Recupera 3 Cristales de Datos → Derrota al Eco del Vacío → Regresa a la nave.';
                } else if (nearby.type === 'scholar') {
                    text += '\n\n[+10 munición] El erudito comparte su saber contigo.';
                }

                this.showDialogue(speaker, text);
            }
        }

        if (this.player.y > 2000) this.damage(100);
    }

    defeatBoss() {
        this.bossDefeated = true;
        this.boss = null;
        this.game.shake(15);
        for (let i = 0; i < 30; i++) {
            this.game.spawnParticle(this.player.x + Math.random() * 100, this.player.y - 50, '#a78bfa', 8, 12);
        }
        this.showDialogue('E.D.E.N.', '¡El Eco del Vacío ha sido silenciado! Dirígete al Nexo para despegar.');
    }

    completeLevel() {
        if (this.levelComplete) return;
        this.levelComplete = true;

        /* Stop simulating the world the instant the planet is "done". The
           1.5s post-victory dialogue used to keep the boss/enemies/projectiles
           and tile collisions running every frame and — combined with the
           heavy backdrop-filter overlays on top — that locked up the browser
           on lower-spec machines ("tranca todo el navegador"). Clearing these
           arrays makes the per-frame loop trivial until switchMode('space'). */
        this.enemies = [];
        this.projectiles = [];
        this.boss = null;
        this.bossDefeated = true;
        this.ui.btnInteract.style.display = 'none';

        /* Defer the XP grant off the input frame so the parent app's state
           update + ranking publish don't stall the very frame where we're
           transitioning back to space. */
        if (window.arborito) {
            try {
                setTimeout(() => { try { window.arborito.xp(200); } catch (_) {} }, 0);
            } catch (_) { /* ignore */ }
        }

        this.game.story?.onPlanetComplete(this.planet);
        setTimeout(() => this.game.switchMode('space'), 1500);
    }

    updateBoss() {
        const b = this.boss;
        const dist = this.player.x - b.x;
        const distY = this.player.y - b.y;

        if (Math.abs(dist) < 600) {
            const dir = Math.sign(dist);
            b.vx += dir * 0.12;
            b.vx = Math.max(-3.5, Math.min(3.5, b.vx));

            if (b.grounded && (Math.random() < 0.015 || (distY < -60 && Math.random() < 0.04))) {
                b.vy = -14;
                b.grounded = false;
            }

            b.fireTimer--;
            if (b.fireTimer <= 0 && Math.abs(dist) < 400) {
                b.fireTimer = 60;
                const shootDir = Math.sign(dist) || 1;
                this.projectiles.push({
                    x: b.x + 32, y: b.y + 20,
                    w: 14, h: 8,
                    vx: shootDir * 8, vy: -2,
                    life: 90, color: '#a78bfa', enemy: true
                });
            }
        } else {
            b.vx *= 0.9;
        }

        b.vy += this.gravity;
        b.x += b.vx;
        this.resolveEntityTilesX(b);
        b.y += b.vy;
        b.grounded = false;
        this.resolveEntityTilesY(b);

        if (rectIntersect(b, this.player)) {
            this.damage(20);
            this.player.vx = Math.sign(this.player.x - b.x) * 12;
            this.player.vy = -8;
        }
    }

    shoot() {
        if (this.player.ammo > 0) {
            this.player.ammo--;
            this.updateHUD();
            this.projectiles.push({
                x: this.player.x + (this.player.facing === 1 ? 32 : -10),
                y: this.player.y + 24,
                w: 12, h: 6,
                vx: this.player.facing * 15,
                life: 60,
                color: '#facc15'
            });
            this.player.vx -= this.player.facing * 3;
        }
    }

    damage(amount) {
        this.player.health -= amount;
        this.updateHUD();
        this.game.shake(20);
        if (this.player.health <= 0) this.ui.deathScreen.classList.remove('hidden');
    }

    updateHUD() {
        this.ui.healthFill.style.width = `${Math.max(0, this.player.health)}%`;
        this.ui.ammoDisplay.innerText = `MUNICIÓN: ${this.player.ammo} | CRISTALES: ${this.crystalsCollected}/${this.crystalsRequired}`;
    }

    /** Tile collision with spatial bucket lookup — shared by player & enemies. */
    resolveEntityTilesX(ent) {
        for (const t of this.nearbyTiles(ent)) {
            if (rectIntersect(ent, t)) {
                ent.x -= ent.vx;
                ent.vx *= -0.5;
                return;
            }
        }
    }

    resolveEntityTilesY(ent) {
        for (const t of this.nearbyTiles(ent)) {
            if (rectIntersect(ent, t)) {
                if (ent.vy > 0) { ent.y = t.y - ent.h; ent.grounded = true; }
                ent.vy = 0;
                return;
            }
        }
    }

    checkCol(isX) {
        const p = this.player;
        if (isX) {
            for (const t of this.nearbyTiles(p)) {
                if (rectIntersect(p, t)) {
                    if (p.vx > 0) p.x = t.x - p.w;
                    else if (p.vx < 0) p.x = t.x + t.w;
                    p.vx = 0;
                }
            }
        } else {
            for (const t of this.nearbyTiles(p)) {
                if (rectIntersect(p, t)) {
                    if (p.vy > 0) {
                        p.y = t.y - p.h;
                        p.grounded = true;
                    } else if (p.vy < 0) {
                        p.y = t.y + t.h;
                    }
                    p.vy = 0;
                }
            }
        }
    }

    showDialogue(speaker, text) {
        this.activeDialogue = text;
        this.ui.dialogueBox.style.display = 'block';
        this.ui.dialogueSpeaker.innerText = speaker;
        this.ui.dialogueText.innerText = text;
    }

    drawParallax(ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, this.game.height);
        grad.addColorStop(0, withAlpha(this.theme.sky, 'FF'));
        grad.addColorStop(1, withAlpha(this.theme.bgMount, 'FF'));
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,this.game.width, this.game.height);

        ctx.fillStyle = '#fff';
        for(let i=0; i<30; i++) {
             const px = (i * 91283) % this.game.width;
             const py = (i * 38127) % (this.game.height/2);
             ctx.globalAlpha = 0.5;
             ctx.beginPath(); ctx.arc(px, py, 1, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        const mountOffset = this.camera.x * 0.1;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(0, this.game.height);
        for(let x=0; x<this.game.width + 50; x+=50) {
            const h = Math.abs(Math.sin((x + mountOffset) * 0.01)) * 100 + 100;
            ctx.lineTo(x, this.game.height - h);
        }
        ctx.lineTo(this.game.width, this.game.height);
        ctx.fill();
    }

    draw(ctx) {
        if (this.isLoading) {
            this.drawParallax(ctx);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, this.game.width, this.game.height);
            ctx.fillStyle = '#22d3ee';
            ctx.font = 'bold 16px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Sincronizando datos del planeta...', this.game.width / 2, this.game.height / 2);
            return;
        }

        this.drawParallax(ctx);

        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

        this.props.forEach(p => {
            if (p.type === 'hut') Sprites.drawHut(ctx, p.x, p.y, p.w, p.h, this.theme.ground);
            if (p.type === 'beacon') {
                ctx.fillStyle = '#94a3b8'; ctx.fillRect(p.x+10, p.y, 20, p.h);
                ctx.fillStyle = '#22c55e'; ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.arc(p.x+20, p.y, 10, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
            }
        });

        const viewLeft = this.camera.x;
        const viewRight = this.camera.x + (this.game.width / this.zoom);
        const colStart = Math.max(0, Math.floor(viewLeft / this.tileSize) - 1);
        const colEnd = Math.min(this.tilesByCol.length - 1, Math.floor(viewRight / this.tileSize) + 1);
        for (let c = colStart; c <= colEnd; c++) {
            const bucket = this.tilesByCol[c];
            if (!bucket) continue;
            for (const t of bucket) {
                ctx.fillStyle = t.type === 'surface' ? this.theme.ground : '#0f172a';
                ctx.fillRect(t.x, t.y, t.w, t.h);
                if (t.type === 'surface') {
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(t.x, t.y, t.w, 4);
                    if (t.deco === 1) {
                        ctx.fillStyle = this.theme.ground;
                        ctx.beginPath();
                        ctx.moveTo(t.x + 10, t.y);
                        ctx.lineTo(t.x + 12, t.y - 6);
                        ctx.lineTo(t.x + 14, t.y);
                        ctx.fill();
                    }
                }
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.strokeRect(t.x, t.y, t.w, t.h);
            }
        }

        if (this.shipObj) {
            Sprites.drawShipLanded(ctx, this.shipObj.x, this.shipObj.y);
            if (Math.abs(this.player.x - this.shipObj.x) < 80) {
                 ctx.save();
                 ctx.translate(this.shipObj.x + 32, this.shipObj.y - 20);
                 const bob = Math.sin(Date.now()*0.005) * 3;
                 ctx.translate(0, bob);

                 ctx.font = 'bold 8px system-ui, sans-serif';
                 ctx.fillStyle = '#facc15'; ctx.textAlign = 'center';
                 ctx.shadowColor = '#000'; ctx.shadowBlur = 4;

                 ctx.fillStyle = 'rgba(0,0,0,0.8)';
                 ctx.fillRect(-40, -10, 80, 12);
                 ctx.strokeStyle = '#facc15';
                 ctx.strokeRect(-40, -10, 80, 12);

                 ctx.fillStyle = '#facc15';
                 ctx.fillText("PRESS [Z] TO LAUNCH", 0, -1);

                 ctx.restore();
            }
        }

        this.npcs.forEach(n => {
            if (n.type === 'beacon_npc') return;
            Sprites.drawAlien(ctx, n.x, n.y, n.type === 'elder' ? '#facc15' : '#22c55e', n.h, this.player.animFrame);
            if (Math.abs(this.player.x - n.x) < 80) {
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(n.x+16, n.y-10); ctx.lineTo(n.x+24, n.y-20); ctx.lineTo(n.x+8, n.y-20); ctx.fill();
            }
        });

        this.crystals.forEach(c => {
            if (!c.collected) Sprites.drawCrystal(ctx, c.x + 12, c.y + 14, this.player.animFrame, false);
        });

        if (this.boss && !this.bossDefeated) {
            Sprites.drawBossBlob(ctx, this.boss.x, this.boss.y, this.player.animFrame, this.boss.hp / this.boss.maxHp);
        }

        this.enemies.forEach(e => {
            const bounce = Math.abs(Math.sin(this.player.animFrame * 0.4)) * 5;
            Sprites.drawBlob(ctx, e.x, e.y - bounce, '#ef4444');
        });

        ctx.fillStyle = '#facc15';
        this.projectiles.forEach(p => {
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.shadowColor = '#facc15'; ctx.shadowBlur = 10;
        });
        ctx.shadowBlur = 0;

        Sprites.drawAstronaut(ctx, this.player.x, this.player.y, this.player.facing, this.player.state, this.player.animFrame);

        ctx.restore();

        const grad = ctx.createLinearGradient(0, 0, 0, this.game.height);
        grad.addColorStop(0, withAlpha(this.theme.ground, '33'));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillRect(0,0,this.game.width, this.game.height);
        ctx.globalCompositeOperation = 'source-over';
    }
}
