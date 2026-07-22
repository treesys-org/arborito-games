import { SeededRandom, ArtGen, Sprites } from './utils.js';

const SECTOR_NAMES = ['ALFA', 'BETA', 'GAMMA', 'DELTA', 'ÉPSILON', 'ZETA'];

export class SpaceEngine {
 constructor(game) {
 this.game = game;
 this.ship = {
 x: 0, y: 0, vx: 0, vy: 0, angle: -Math.PI / 2,
 fuel: 100, maxFuel: 100,
 shield: 100, maxShield: 100,
 hp: 100, maxHp: 100,
 warpCharge: 0
 };
 this.camera = { x: 0, y: 0 };
 this.systems = [];
 this.activePlanet = null;
 this.activeSector = 0;
 this.input = game.input;
 this.frame = 0;

 this.stick = { active: false, dx: 0, dy: 0, originX: 0, originY: 0 };
 this.stickEl = document.getElementById('stick-knob');
 this.stickContainer = document.getElementById('stick-container');
 this.btnLand = document.getElementById('btn-land');
 this.btnWarp = document.getElementById('btn-warp');
 this.btnFire = document.getElementById('btn-fire');

 this.ui = {
 vel: document.getElementById('hud-vel'),
 fuel: document.getElementById('hud-fuel'),
 fuelBar: document.getElementById('fuel-bar-fill'),
 shield: document.getElementById('hud-shield'),
 shieldBar: document.getElementById('shield-bar-fill'),
 hp: document.getElementById('hud-hp'),
 hpBar: document.getElementById('hp-bar-fill'),
 sector: document.getElementById('hud-sector'),
 radar: document.getElementById('radar-canvas')
 };

 this.bgCanvas = ArtGen.createNebulaBackground(2000, 2000, 'galaxy-nebula');
 this.starLayers = [
 { stars: ArtGen.createStarLayer(120, 2000, 2000, 'stars-far'), parallax: 0.15, size: 1 },
 { stars: ArtGen.createStarLayer(80, 2000, 2000, 'stars-mid'), parallax: 0.35, size: 1.5 },
 { stars: ArtGen.createStarLayer(40, 2000, 2000, 'stars-near'), parallax: 0.6, size: 2 }
 ];
 this.starLayerCanvases = this.starLayers.map(layer => this.bakeStarLayer(layer));
 this.sunGlowCache = new Map();
 this.radarFrame = 0;

 this.asteroids = [];
 this.enemies = [];
 this.projectiles = [];
 this.comets = [];
 this.pickups = [];
 this.warpActive = false;
 this.warpTimer = 0;
 this.lastSectorNotified = -1;
 this.fireCooldown = 0;

 this.initTouch();
 }

 bakeStarLayer(layer) {
 /* Pre-baked 8000px tile wraps via wrapCoord so parallax never regenerates stars per frame. */
 const size = 8000;
 const canvas = document.createElement('canvas');
 canvas.width = size;
 canvas.height = size;
 const ctx = canvas.getContext('2d');
 layer.stars.forEach(s => {
 ctx.fillStyle = s.color;
 ctx.beginPath();
 ctx.arc(s.x % size, s.y % size, s.size, 0, Math.PI * 2);
 ctx.fill();
 });
 return { canvas, size, parallax: layer.parallax };
 }

 wrapCoord(v, size) {
 return ((v % size) + size) % size;
 }

 getSunGlowCanvas(sys) {
 const key = sys.index;
 if (this.sunGlowCache.has(key)) return this.sunGlowCache.get(key);
 const c = document.createElement('canvas');
 c.width = 1300;
 c.height = 1300;
 const ctx = c.getContext('2d');
 const cx = 650, cy = 650;
 const grad = ctx.createRadialGradient(cx, cy, 80, cx, cy, 650);
 grad.addColorStop(0, sys.sunGlow || 'rgba(253, 224, 71, 0.35)');
 grad.addColorStop(0.4, 'rgba(234, 179, 8, 0.06)');
 grad.addColorStop(1, 'transparent');
 ctx.fillStyle = grad;
 ctx.beginPath();
 ctx.arc(cx, cy, 650, 0, Math.PI * 2);
 ctx.fill();
 this.sunGlowCache.set(key, c);
 return c;
 }

 initTouch() {
 const handleStart = (e) => {
 e.preventDefault();
 const touch = e.targetTouches[0];
 const rect = this.stickContainer.getBoundingClientRect();
 this.stick.originX = rect.left + rect.width / 2;
 this.stick.originY = rect.top + rect.height / 2;
 this.stick.active = true;
 this.updateStick(touch.clientX, touch.clientY);
 };
 const handleMove = (e) => {
 if (!this.stick.active) return;
 e.preventDefault();
 this.updateStick(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
 };
 const handleEnd = (e) => {
 e.preventDefault();
 this.stick.active = false;
 this.stick.dx = 0; this.stick.dy = 0;
 this.stickEl.style.transform = 'translate(0px, 0px)';
 };

 this.stickContainer?.addEventListener('touchstart', handleStart);
 this.stickContainer?.addEventListener('touchmove', handleMove);
 this.stickContainer?.addEventListener('touchend', handleEnd);
 this.stickContainer?.addEventListener('touchcancel', handleEnd);

 this.btnLand?.addEventListener('touchstart', (e) => {
 e.preventDefault();
 this.input.setKey(' ', true);
 if (this.activePlanet) this.game.switchMode('planet');
 });
 this.btnLand?.addEventListener('touchend', (e) => { e.preventDefault(); this.input.setKey(' ', false); });

 this.btnFire?.addEventListener('touchstart', (e) => { e.preventDefault(); this.input.setKey('r', true); });
 this.btnFire?.addEventListener('touchend', (e) => { e.preventDefault(); this.input.setKey('r', false); });

 this.btnWarp?.addEventListener('touchstart', (e) => { e.preventDefault(); this.input.setKey('Shift', true); });
 this.btnWarp?.addEventListener('touchend', (e) => { e.preventDefault(); this.input.setKey('Shift', false); });
 }

 updateStick(x, y) {
 const rect = this.stickContainer?.getBoundingClientRect();
 const maxDist = rect ? Math.min(40, rect.width * 0.32) : 40;
 let dx = x - this.stick.originX, dy = y - this.stick.originY;
 const dist = Math.hypot(dx, dy);
 if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
 this.stick.dx = dx / maxDist;
 this.stick.dy = dy / maxDist;
 this.stickEl.style.transform = `translate(${dx}px, ${dy}px)`;
 }

 resetJoystick() {
 this.stick.active = false;
 this.stick.dx = 0; this.stick.dy = 0;
 if (this.stickEl) this.stickEl.style.transform = 'translate(0px, 0px)';
 }

 generateGalaxy(lessons) {
 /* Curriculum lessons → planets; cap session length so 50 lessons aren't endless. */
 const MAX_SESSION_PLANETS = 8;
 const sessionLessons = (lessons || []).slice(0, MAX_SESSION_PLANETS);
 this.systems = [];
 this.asteroids = [];
 this.enemies = [];
 this.comets = [];
 this.pickups = [];
 let chunkIndex = 0;
 const chunkSize = 4;

 for (let i = 0; i < sessionLessons.length; i += chunkSize) {
 const chunk = sessionLessons.slice(i, i + chunkSize);
 const sysX = (chunkIndex % 3) * 5500;
 const sysY = Math.floor(chunkIndex / 3) * 5500;
 const rng = new SeededRandom(`sector-${chunkIndex}`);
 const sunHue = rng.range(30, 60);

 const system = {
 name: `SECTOR ${SECTOR_NAMES[chunkIndex] || String.fromCharCode(65 + chunkIndex)}`,
 index: chunkIndex,
 x: sysX, y: sysY,
 sunColor: `hsl(${sunHue}, 90%, 60%)`,
 sunGlow: `hsla(${sunHue}, 80%, 50%, 0.3)`,
 planets: [],
 gate: null
 };

 chunk.forEach((l, idx) => {
 const dist = 700 + idx * 450;
 const angle = rng.range(0, Math.PI * 2);
 const radius = rng.range(110, 200);
 const color = `hsl(${rng.range(0, 360)}, 70%, 50%)`;
 const texture = ArtGen.createPlanetTexture(radius, color, system.name + idx);
 const hasRing = rng.next() > 0.6;
 const hasMoon = rng.next() > 0.5;

 system.planets.push({
 data: { ...l, index: i + idx },
 x: sysX + Math.cos(angle) * dist,
 y: sysY + Math.sin(angle) * dist,
 radius, texture, color,
 orbitSpeed: rng.range(0.00015, 0.0006) * (idx % 2 === 0 ? 1 : -1),
 angle, dist,
 hasRing,
 moon: hasMoon ? { dist: radius + 40, angle: rng.range(0, 6), speed: 0.003 } : null,
 collected: false
 });
 });

 if (chunkIndex > 0) {
 system.gate = {
 x: sysX - 800, y: sysY,
 radius: 60, active: false, targetSector: chunkIndex
 };
 }

 this.spawnSectorHazards(system, rng);
 this.systems.push(system);
 chunkIndex++;
 }

 for (let i = 0; i < 8; i++) {
 const rng = new SeededRandom(`comet-${i}`);
 this.comets.push({
 x: rng.range(-2000, 15000),
 y: rng.range(-2000, 15000),
 vx: rng.range(-3, 3), vy: rng.range(-3, 3),
 tail: rng.range(80, 200),
 size: rng.range(4, 10)
 });
 }

 this.ship.x = this.systems[0]?.x + 200 || 0;
 this.ship.y = this.systems[0]?.y || 0;
 }

 spawnSectorHazards(system, rng) {
 for (let i = 0; i < 25 + system.index * 10; i++) {
 const beltDist = rng.range(400, 900);
 const beltAngle = rng.range(0, Math.PI * 2);
 const size = rng.range(15, 45);
 this.asteroids.push({
 x: system.x + Math.cos(beltAngle) * beltDist,
 y: system.y + Math.sin(beltAngle) * beltDist,
 size,
 texture: ArtGen.createAsteroidTexture(size * 2, `ast-${system.index}-${i}`),
 vx: rng.range(-0.3, 0.3), vy: rng.range(-0.3, 0.3),
 hp: Math.ceil(size / 10),
 sector: system.index
 });
 }

 const enemyCount = 2 + system.index * 2;
 for (let i = 0; i < enemyCount; i++) {
 const ang = rng.range(0, Math.PI * 2);
 const dist = rng.range(1200, 2500);
 this.enemies.push({
 x: system.x + Math.cos(ang) * dist,
 y: system.y + Math.sin(ang) * dist,
 vx: 0, vy: 0, angle: 0,
 hp: 30 + system.index * 10,
 aggro: false, sector: system.index,
 fireTimer: 0
 });
 }
 }

 update() {
 if (this.game.mode === 'story') return;
 this.frame++;

 let thrust = 0, turn = 0;
 const keys = this.input.keys;

 if (keys['ArrowUp'] || keys['w'] || keys['W']) thrust = 0.55;
 if (keys['ArrowLeft'] || keys['a'] || keys['A']) turn = -0.06;
 if (keys['ArrowRight'] || keys['d'] || keys['D']) turn = 0.06;

 if (this.stick.active) {
 const mag = Math.hypot(this.stick.dx, this.stick.dy);
 if (mag > 0.2) {
 const targetAngle = Math.atan2(this.stick.dy, this.stick.dx);
 let diff = targetAngle - this.ship.angle;
 while (diff < -Math.PI) diff += Math.PI * 2;
 while (diff > Math.PI) diff -= Math.PI * 2;
 this.ship.angle += diff * 0.12;
 thrust = Math.min(mag, 1.0) * 0.55;
 }
 }

 const wantsWarp = keys['Shift'] && this.ship.fuel > 20;
 if (wantsWarp && !this.warpActive) {
 this.warpActive = true;
 this.warpTimer = 30;
 this.ship.fuel -= 20;
 this.game.shake(8);
 }
 if (this.warpActive) {
 this.warpTimer--;
 const warpBoost = 4.0;
 this.ship.vx += Math.cos(this.ship.angle) * warpBoost;
 this.ship.vy += Math.sin(this.ship.angle) * warpBoost;
 for (let i = 0; i < 3; i++) {
 this.game.spawnParticle(
 this.ship.x - Math.cos(this.ship.angle) * 30,
 this.ship.y - Math.sin(this.ship.angle) * 30,
 i === 0 ? '#22d3ee' : '#a78bfa', 4, 5
);
 }
 if (this.warpTimer <= 0) this.warpActive = false;
 } else if (thrust > 0 && this.ship.fuel > 0) {
 this.ship.vx += Math.cos(this.ship.angle) * thrust;
 this.ship.vy += Math.sin(this.ship.angle) * thrust;
 this.ship.fuel = Math.max(0, this.ship.fuel - 0.08);
 if (this.frame % 3 === 0) {
 const bx = this.ship.x - Math.cos(this.ship.angle) * 28;
 const by = this.ship.y - Math.sin(this.ship.angle) * 28;
 this.game.spawnParticle(bx, by, '#3b82f6', 2, 6);
 }
 }

 this.ship.angle += turn;
 this.ship.vx *= 0.965;
 this.ship.vy *= 0.965;
 this.ship.x += this.ship.vx;
 this.ship.y += this.ship.vy;

 this.systems.forEach(sys => {
 const d = Math.hypot(this.ship.x - sys.x, this.ship.y - sys.y);
 if (d < 500) this.ship.fuel = Math.min(this.ship.maxFuel, this.ship.fuel + 0.15);
 if (d < 800) this.ship.shield = Math.min(this.ship.maxShield, this.ship.shield + 0.08);
 });

 this.camera.x += (this.ship.x - this.game.width / 2 - this.camera.x) * 0.08;
 this.camera.y += (this.ship.y - this.game.height / 2 - this.camera.y) * 0.08;

 this.systems.forEach(sys => {
 sys.planets.forEach(p => {
 p.angle += p.orbitSpeed;
 p.x = sys.x + Math.cos(p.angle) * p.dist;
 p.y = sys.y + Math.sin(p.angle) * p.dist;
 if (p.moon) {
 p.moon.angle += p.moon.speed;
 }
 p.collected = this.game.story?.isPlanetDone(p) || false;
 });
 });

 this.updateAsteroids();
 this.updateEnemies();
 this.updateComets();
 this.updateProjectiles();
 this.checkProximity();
 this.checkSector();
 this.updateHUD();
 if (this.frame % 8 === 0) this.drawRadar();
 }

 fire() {
 if (this.fireCooldown > 0) return;
 this.fireCooldown = 12;
 this.projectiles.push({
 x: this.ship.x + Math.cos(this.ship.angle) * 30,
 y: this.ship.y + Math.sin(this.ship.angle) * 30,
 vx: Math.cos(this.ship.angle) * 18,
 vy: Math.sin(this.ship.angle) * 18,
 life: 50, friendly: true
 });
 this.game.shake(2);
 }

 updateProjectiles() {
 /* SPACE is reserved for "land on nearest planet" in space mode. */
 if (this.input.consume('r') || this.input.consume('R') ||
 this.input.consume('z') || this.input.consume('Z') ||
 this.input.consume('j') || this.input.consume('J') ||
 this.input.consume('f') || this.input.consume('F')) this.fire();
 if (this.fireCooldown > 0) this.fireCooldown--;

 for (let i = this.projectiles.length - 1; i >= 0; i--) {
 const p = this.projectiles[i];
 p.x += p.vx; p.y += p.vy; p.life--;
 if (p.life <= 0) { this.projectiles.splice(i, 1); continue; }

 if (p.friendly) {
 for (let j = this.enemies.length - 1; j >= 0; j--) {
 const e = this.enemies[j];
 if (Math.abs(p.x - e.x) > 40 || Math.abs(p.y - e.y) > 40) continue;
 if (Math.hypot(p.x - e.x, p.y - e.y) < 25) {
 e.hp -= 15;
 this.projectiles.splice(i, 1);
 this.game.spawnParticle(e.x, e.y, '#ef4444', 5, 6);
 if (e.hp <= 0) {
 this.enemies.splice(j, 1);
 this.spawnPickup(e.x, e.y, 'fuel');
 this.game.shake(4);
 }
 break;
 }
 }
 for (let j = this.asteroids.length - 1; j >= 0; j--) {
 const a = this.asteroids[j];
 if (Math.hypot(p.x - a.x, p.y - a.y) < a.size) {
 a.hp--;
 this.projectiles.splice(i, 1);
 this.game.spawnParticle(a.x, a.y, '#94a3b8', 3, 4);
 if (a.hp <= 0) {
 this.asteroids.splice(j, 1);
 this.spawnPickup(a.x, a.y, Math.random() > 0.5 ? 'fuel' : 'shield');
 }
 break;
 }
 }
 } else if (Math.hypot(p.x - this.ship.x, p.y - this.ship.y) < 20) {
 this.damageShip(8);
 this.projectiles.splice(i, 1);
 }
 }
 }

 damageShip(amount) {
 if (this.ship.shield > 0) {
 this.ship.shield = Math.max(0, this.ship.shield - amount);
 } else {
 this.ship.hp = Math.max(0, this.ship.hp - amount * 0.5);
 }
 this.game.shake(6);
 if (this.ship.hp <= 0) {
 this.ship.hp = this.ship.maxHp;
 this.ship.x = this.systems[this.activeSector]?.x + 200 || 0;
 this.ship.y = this.systems[this.activeSector]?.y || 0;
 this.ship.vx = 0; this.ship.vy = 0;
 this.game.story?.queue([{ speaker: 'E.D.E.N.', text: '¡Escudos colapsados! Teletransporte de emergencia activado.' }]);
 }
 }

 spawnPickup(x, y, type) {
 this.pickups.push({ x, y, type, life: 600 });
 }

 updateAsteroids() {
 const sx = this.ship.x, sy = this.ship.y;
 this.asteroids.forEach(a => {
 if (Math.abs(a.x - sx) > 2500 || Math.abs(a.y - sy) > 2500) return;
 a.x += a.vx; a.y += a.vy;
 if (Math.hypot(sx - a.x, sy - a.y) < a.size + 15) {
 this.damageShip(12);
 this.ship.vx += (sx - a.x) * 0.05;
 this.ship.vy += (sy - a.y) * 0.05;
 }
 });
 for (let i = this.pickups.length - 1; i >= 0; i--) {
 const pk = this.pickups[i];
 pk.life--;
 if (pk.life <= 0) { this.pickups.splice(i, 1); continue; }
 if (Math.hypot(this.ship.x - pk.x, this.ship.y - pk.y) < 30) {
 if (pk.type === 'fuel') this.ship.fuel = Math.min(this.ship.maxFuel, this.ship.fuel + 25);
 else this.ship.shield = Math.min(this.ship.maxShield, this.ship.shield + 20);
 this.pickups.splice(i, 1);
 this.game.spawnParticle(pk.x, pk.y, '#22d3ee', 4, 5);
 }
 }
 }

 updateEnemies() {
 const sx = this.ship.x, sy = this.ship.y;
 this.enemies.forEach(e => {
 const dist = Math.hypot(sx - e.x, sy - e.y);
 if (dist > 1200) return;
 if (dist < 800) {
 e.aggro = true;
 const angle = Math.atan2(this.ship.y - e.y, this.ship.x - e.x);
 e.angle = angle;
 e.vx += Math.cos(angle) * 0.15;
 e.vy += Math.sin(angle) * 0.15;
 const speed = Math.hypot(e.vx, e.vy);
 if (speed > 3.5) { e.vx = (e.vx / speed) * 3.5; e.vy = (e.vy / speed) * 3.5; }
 e.x += e.vx; e.y += e.vy;

 e.fireTimer--;
 if (e.fireTimer <= 0 && dist < 500) {
 e.fireTimer = 80 + Math.random() * 40;
 this.projectiles.push({
 x: e.x, y: e.y,
 vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10,
 life: 80, friendly: false
 });
 }
 } else {
 e.vx *= 0.95; e.vy *= 0.95;
 e.x += e.vx; e.y += e.vy;
 }
 if (dist < 30) this.damageShip(15);
 });
 }

 updateComets() {
 const sx = this.ship.x, sy = this.ship.y;
 this.comets.forEach(c => {
 if (Math.abs(c.x - sx) > 3000 || Math.abs(c.y - sy) > 3000) return;
 c.x += c.vx; c.y += c.vy;
 if (Math.hypot(sx - c.x, sy - c.y) < c.size + 20) {
 this.damageShip(20);
 this.game.shake(10);
 }
 });
 }

 checkSector() {
 let nearest = 0, minDist = Infinity;
 this.systems.forEach((sys, i) => {
 const d = Math.hypot(this.ship.x - sys.x, this.ship.y - sys.y);
 if (d < minDist) { minDist = d; nearest = i; }
 });
 if (nearest !== this.activeSector) {
 this.activeSector = nearest;
 if (this.lastSectorNotified !== nearest) {
 this.lastSectorNotified = nearest;
 this.game.story?.onEnterSector(nearest);
 }
 }
 if (this.ui.sector) {
 this.ui.sector.textContent = this.systems[this.activeSector]?.name || 'UNKNOWN';
 }
 }

 checkProximity() {
 let nearest = null, dist = Infinity;
 this.systems.forEach(sys => {
 sys.planets.forEach(p => {
 const d = Math.hypot(this.ship.x - p.x, this.ship.y - p.y);
 if (d < p.radius + 280 && d < dist) { dist = d; nearest = p; }
 });
 });
 this.activePlanet = nearest;

 if (this.activePlanet && this.input.consume(' ')) {
 this.game.switchMode('planet');
 }

 if (this.btnLand) {
 const show = !!this.activePlanet;
 this.btnLand.style.display = show ? 'flex' : 'none';
 if (show && !this._landHintShown) {
 this._landHintShown = true;
 this.game.showFx?.('Planeta a alcance, aterriza', 'quest', 2000);
 }
 if (!show) this._landHintShown = false;
 }
 }

 updateHUD() {
 const speed = Math.hypot(this.ship.vx, this.ship.vy).toFixed(1);
 if (this.ui.vel) this.ui.vel.textContent = `${speed} km/s`;
 if (this.ui.fuel) this.ui.fuel.textContent = `${Math.floor(this.ship.fuel)}%`;
 if (this.ui.fuelBar) this.ui.fuelBar.style.width = `${this.ship.fuel}%`;
 if (this.ui.shield) this.ui.shield.textContent = `${Math.floor(this.ship.shield)}%`;
 if (this.ui.shieldBar) this.ui.shieldBar.style.width = `${this.ship.shield}%`;
 if (this.ui.hp) this.ui.hp.textContent = `${Math.floor(this.ship.hp)}%`;
 if (this.ui.hpBar) this.ui.hpBar.style.width = `${this.ship.hp}%`;
 }

 drawRadar() {
 const canvas = this.ui.radar;
 if (!canvas) return;
 const ctx = canvas.getContext('2d');
 const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, range = 3000;
 ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
 ctx.fillRect(0, 0, w, h);
 ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)'; ctx.lineWidth = 1;
 ctx.beginPath(); ctx.arc(cx, cy, w / 2 - 2, 0, Math.PI * 2); ctx.stroke();
 ctx.beginPath(); ctx.arc(cx, cy, w / 4, 0, Math.PI * 2); ctx.stroke();

 const plot = (wx, wy, color, size) => {
 const dx = (wx - this.ship.x) / range * (w / 2);
 const dy = (wy - this.ship.y) / range * (h / 2);
 if (Math.hypot(dx, dy) > w / 2 - 3) return;
 ctx.fillStyle = color;
 ctx.beginPath(); ctx.arc(cx + dx, cy + dy, size, 0, Math.PI * 2); ctx.fill();
 };

 this.systems.forEach(sys => {
 sys.planets.forEach(p => plot(p.x, p.y, p.collected ? '#64748b' : '#22c55e', 3));
 plot(sys.x, sys.y, '#facc15', 4);
 });
 this.enemies.forEach(e => plot(e.x, e.y, '#ef4444', 2));
 ctx.fillStyle = '#22d3ee';
 ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
 }

 draw(ctx) {
 const bgSize = 2000;
 const nebulaOffX = -this.camera.x * 0.3;
 const nebulaOffY = -this.camera.y * 0.3;
 const startX = Math.floor((this.camera.x * 0.3) / bgSize) * bgSize;
 const startY = Math.floor((this.camera.y * 0.3) / bgSize) * bgSize;

 for (let x = startX - bgSize; x < startX + bgSize * 2; x += bgSize) {
 for (let y = startY - bgSize; y < startY + bgSize * 2; y += bgSize) {
 ctx.drawImage(this.bgCanvas, x + nebulaOffX, y + nebulaOffY);
 }
 }

 this.starLayerCanvases.forEach(layer => {
 const px = this.wrapCoord(-this.camera.x * layer.parallax, layer.size);
 const py = this.wrapCoord(-this.camera.y * layer.parallax, layer.size);
 ctx.drawImage(layer.canvas, px - layer.size, py - layer.size);
 ctx.drawImage(layer.canvas, px, py - layer.size);
 ctx.drawImage(layer.canvas, px - layer.size, py);
 ctx.drawImage(layer.canvas, px, py);
 });

 ctx.save();
 ctx.translate(-this.camera.x, -this.camera.y);

 this.comets.forEach(c => {
 const tailAngle = Math.atan2(-c.vy, -c.vx);
 ctx.strokeStyle = 'rgba(165, 243, 252, 0.4)';
 ctx.lineWidth = c.size;
 ctx.beginPath();
 ctx.moveTo(c.x, c.y);
 ctx.lineTo(c.x + Math.cos(tailAngle) * c.tail, c.y + Math.sin(tailAngle) * c.tail);
 ctx.stroke();
 ctx.fillStyle = '#fff';
 ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2); ctx.fill();
 });

 const viewPad = 2000;
 this.systems.forEach(sys => {
 if (Math.abs(sys.x - this.ship.x) > 6000 || Math.abs(sys.y - this.ship.y) > 6000) return;
 this.drawSun(ctx, sys);

 if (sys.gate) {
 const g = sys.gate;
 const rot = this.frame * 0.02;
 ctx.save();
 ctx.translate(g.x, g.y);
 ctx.rotate(rot);
 ctx.strokeStyle = 'rgba(167, 139, 250, 0.6)'; ctx.lineWidth = 2;
 ctx.beginPath(); ctx.ellipse(0, 0, g.radius, g.radius * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
 ctx.strokeStyle = 'rgba(167, 139, 250, 0.3)';
 ctx.beginPath(); ctx.ellipse(0, 0, g.radius * 0.7, g.radius * 0.3, Math.PI / 4, 0, Math.PI * 2); ctx.stroke();
 ctx.restore();
 }

 ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
 sys.planets.forEach(p => {
 ctx.beginPath(); ctx.arc(sys.x, sys.y, p.dist, 0, Math.PI * 2); ctx.stroke();
 });

 sys.planets.forEach(p => this.drawPlanet(ctx, sys, p));
 });

 this.asteroids.forEach(a => {
 if (Math.hypot(a.x - this.ship.x, a.y - this.ship.y) > 2000) return;
 ctx.drawImage(a.texture, a.x - a.size, a.y - a.size, a.size * 2, a.size * 2);
 });

 this.pickups.forEach(pk => {
 const bob = Math.sin(this.frame * 0.1 + pk.x) * 3;
 ctx.fillStyle = pk.type === 'fuel' ? '#f59e0b' : '#38bdf8';
 ctx.beginPath(); ctx.arc(pk.x, pk.y + bob, 8, 0, Math.PI * 2); ctx.fill();
 });

 this.enemies.forEach(e => {
 if (Math.hypot(e.x - this.ship.x, e.y - this.ship.y) > 2500) return;
 ctx.save();
 ctx.translate(e.x, e.y);
 ctx.rotate(e.angle);
 Sprites.drawVoidSkiff(ctx, this.frame, e.aggro);
 ctx.restore();
 });

 this.projectiles.forEach(p => {
 ctx.fillStyle = p.friendly ? '#facc15' : '#ef4444';
 ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
 });

 this.drawShip(ctx);

 if (this.activePlanet) {
 ctx.save();
 ctx.translate(this.ship.x, this.ship.y);
 const scale = 1 + Math.sin(this.frame * 0.08) * 0.08;
 ctx.scale(scale, scale);
 ctx.fillStyle = '#22c55e';
 ctx.font = 'bold 14px system-ui, sans-serif';
 ctx.textAlign = 'center';
 ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
 ctx.fillText('[ESPACIO] ATERRIZAR', 0, -45);
 ctx.restore();
 }

 if (this.warpActive) {
 ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
 ctx.lineWidth = 2;
 const streakCount = 8;
 for (let i = 0; i < streakCount; i++) {
 const ang = (this.frame * 0.3 + i * (Math.PI * 2 / streakCount)) % (Math.PI * 2);
 const len = 150 + (i % 3) * 80;
 ctx.beginPath();
 ctx.moveTo(this.ship.x, this.ship.y);
 ctx.lineTo(this.ship.x + Math.cos(ang) * len, this.ship.y + Math.sin(ang) * len);
 ctx.stroke();
 }
 }

 ctx.restore();
 }

 drawSun(ctx, sys) {
 const pulse = 1 + Math.sin(this.frame * 0.03) * 0.05;
 const glow = this.getSunGlowCanvas(sys);
 ctx.save();
 ctx.globalCompositeOperation = 'screen';
 ctx.drawImage(glow, sys.x - 650, sys.y - 650, 1300, 1300);
 ctx.globalCompositeOperation = 'source-over';
 ctx.restore();

 if (Math.hypot(this.ship.x - sys.x, this.ship.y - sys.y) < 3500) {
 for (let i = 0; i < 4; i++) {
 const a = (this.frame * 0.008 + i * Math.PI / 2);
 const flareLen = 120 + Math.sin(this.frame * 0.05 + i) * 40;
 ctx.strokeStyle = `rgba(250, 204, 21, ${0.1 + Math.sin(this.frame * 0.04 + i) * 0.05})`;
 ctx.lineWidth = 3;
 ctx.beginPath();
 ctx.moveTo(sys.x + Math.cos(a) * 90, sys.y + Math.sin(a) * 90);
 ctx.lineTo(sys.x + Math.cos(a) * (90 + flareLen), sys.y + Math.sin(a) * (90 + flareLen));
 ctx.stroke();
 }
 }

 ctx.fillStyle = sys.sunColor || '#fef08a';
 ctx.beginPath(); ctx.arc(sys.x, sys.y, 85 * pulse, 0, Math.PI * 2); ctx.fill();

 ctx.fillStyle = '#fff';
 ctx.font = 'bold 72px monospace';
 ctx.globalAlpha = 0.12;
 ctx.textAlign = 'center';
 ctx.fillText(sys.name, sys.x, sys.y + 25);
 ctx.globalAlpha = 1;
 }

 drawPlanet(ctx, sys, p) {
 const isActive = p === this.activePlanet;

 if (p.moon) {
 const mx = p.x + Math.cos(p.moon.angle) * p.moon.dist;
 const my = p.y + Math.sin(p.moon.angle) * p.moon.dist;
 ctx.fillStyle = '#94a3b8';
 ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2); ctx.fill();
 }

 if (p.hasRing) {
 ctx.save();
 ctx.translate(p.x, p.y);
 ctx.scale(1, 0.3);
 ctx.strokeStyle = `rgba(255,255,255,${isActive ? 0.3 : 0.15})`;
 ctx.lineWidth = 3;
 ctx.beginPath(); ctx.arc(0, 0, p.radius + 25, 0, Math.PI * 2); ctx.stroke();
 ctx.restore();
 }

 ctx.drawImage(p.texture, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);

 const angToSun = Math.atan2(p.y - sys.y, p.x - sys.x);
 ctx.save();
 ctx.beginPath();
 ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
 ctx.clip();
 ctx.globalCompositeOperation = 'multiply';
 ctx.fillStyle = 'rgba(0,0,0,0.55)';
 ctx.beginPath();
 ctx.arc(p.x, p.y, p.radius, angToSun - Math.PI / 2, angToSun + Math.PI / 2);
 ctx.lineTo(p.x, p.y);
 ctx.closePath();
 ctx.fill();
 ctx.globalCompositeOperation = 'source-over';
 ctx.restore();

 if (isActive) {
 ctx.globalCompositeOperation = 'screen';
 const glow = ctx.createRadialGradient(p.x, p.y, p.radius, p.x, p.y, p.radius + 50);
 glow.addColorStop(0, p.color);
 glow.addColorStop(1, 'transparent');
 ctx.fillStyle = glow;
 ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 50, 0, Math.PI * 2); ctx.fill();
 ctx.globalCompositeOperation = 'source-over';

 ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2;
 ctx.setLineDash([10, 10]);
 ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 35, this.frame * 0.02, this.frame * 0.02 + Math.PI * 2); ctx.stroke();
 ctx.setLineDash([]);
 }

 if (p.collected) {
 ctx.fillStyle = '#22c55e';
 ctx.font = 'bold 20px system-ui';
 ctx.textAlign = 'center';
 ctx.fillText('✓', p.x, p.y + 7);
 } else if (isActive) {
 Sprites.drawCrystal(ctx, p.x, p.y - p.radius - 20, this.frame, false);
 ctx.fillStyle = '#22c55e';
 ctx.font = 'bold 16px system-ui, sans-serif';
 ctx.textAlign = 'center';
 ctx.fillText(p.data.title.toUpperCase(), p.x, p.y - p.radius - 45);
 ctx.fillStyle = '#94a3b8';
 ctx.font = '11px monospace';
 ctx.fillText('FRAGMENTO DE DATOS DETECTADO', p.x, p.y - p.radius - 28);
 }
 }

 drawShip(ctx) {
 ctx.save();
 ctx.translate(this.ship.x, this.ship.y);
 const thrust = (this.input.keys['ArrowUp'] || this.input.keys['w'] || this.input.keys['W'] || this.stick.active) ? 1 : 0;
 Sprites.drawSpaceShip(ctx, this.ship.angle, this.warpActive ? 2 : thrust, this.ship.shield / 100, this.frame);
 ctx.restore();
 }
}
