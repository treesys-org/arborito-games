import { CONFIG, STAIR_UP, STAIR_DOWN, ELEV_SIGN } from './core.js';

export class Building {
 constructor() {
 this.floors = [];
 this.w = 22;
 this.h = 14;
 this.labels = { lobby: 'LOBBY', cafe: 'CAFE' };
 this.elevators = [];
 }

 generate(deptNames, labels = {}) {
 this.labels = { lobby: labels.lobby || 'LOBBY', cafe: labels.cafe || 'CAFE' };
 this.floors = [];
 this.elevators = [];
 this.floors.push(this.makeLobby());
 this.floors.push(this.makeCafeteria(1, this.labels.cafe));
 deptNames.forEach((n, i) => this.floors.push(this.makeOffice(i + 2, n)));

 const total = this.floors.length;
 this.floors.forEach((floor, z) => this.installElevator(floor.map, z, total));
 }

 installElevator(map, floorZ, totalFloors) {
 /* Stairs sit at opposite corners of the floor so a learner that's
 been mentored on, say, floor 3 has to run all the way across to
 reach the down stairs and answer a call on the lobby. The
 sense of distance is intentional. */
 const upX = 2;
 const upY = 2;
 const downX = this.w - 3;
 const downY = this.h - 3;

 const carve = (cx, cy) => {
 for (let dy = -1; dy <= 1; dy++) {
 for (let dx = -1; dx <= 1; dx++) {
 const tx = cx + dx;
 const ty = cy + dy;
 if (ty > 0 && ty < this.h - 1 && tx > 0 && tx < this.w - 1 && map[ty][tx] === 1) {
 map[ty][tx] = 0;
 }
 }
 }
 };

 carve(upX, upY);
 carve(downX, downY);

 if (floorZ < totalFloors - 1) {
 map[upY][upX] = STAIR_UP;
 if (upY - 1 >= 1) map[upY - 1][upX] = ELEV_SIGN;
 this.elevators.push({ x: upX, y: upY, z: floorZ, dir: 'up' });
 }

 if (floorZ > 0) {
 map[downY][downX] = STAIR_DOWN;
 if (downY + 1 < this.h - 1) map[downY + 1][downX] = ELEV_SIGN;
 this.elevators.push({ x: downX, y: downY, z: floorZ, dir: 'down' });
 }

 const floor = this.floors[floorZ];
 if (floor) {
 const sideUpX = Math.min(upX + 1, this.w - 2);
 const sideUpY = Math.min(upY + 1, this.h - 2);
 const sideDownX = Math.max(downX - 1, 1);
 const sideDownY = Math.max(downY - 1, 1);

 /* "spawns.down" is where the player lands after climbing UP into
 this floor, they exit the up-staircase. "spawns.up" is where
 they land after descending DOWN into this floor, they exit
 the down-staircase. Names date back to v1; kept for compat. */
 floor.spawns.down = { x: sideUpX, y: sideUpY };
 floor.spawns.up = { x: sideDownX, y: sideDownY };
 floor.elevatorX = upX;
 floor.elevatorY = upY;
 floor.downStairX = downX;
 floor.downStairY = downY;
 }
 }

 makeLobby() {
 const map = this.blankMap();
 this.fill(map, 0, 0, this.w, this.h, 1);
 this.fill(map, 1, 1, this.w - 2, this.h - 2, 7);
 this.fill(map, 2, 2, this.w - 4, 1, 0);
 this.fill(map, 2, this.h - 3, this.w - 4, 1, 0);
 this.fill(map, 8, 4, 6, 1, 2);

 for (let x = 6; x < this.w - 6; x += 5) {
 map[2][x] = 12;
 }

 const npcs = [{
 x: 11, y: 5, role: 'Receptionist',
 shirt: '#ef4444', hair: '#1e293b',
 phrase: 'Welcome.', moveTimer: 0,
 isReceptionist: true
 }];

 map[this.h - 4][5] = 9;

 return {
 z: 0,
 name: this.labels.lobby,
 map,
 npcs,
 spawns: { up: { x: 10, y: 6 }, down: { x: 11, y: 7 } }
 };
 }

 makeCafeteria(z, name) {
 const map = this.blankMap();
 this.fill(map, 0, 0, this.w, this.h, 1);
 this.fill(map, 1, 1, this.w - 2, this.h - 2, 6);
 this.fill(map, 7, 5, 8, 1, 8);

 const stairZones = [
 { x: 2, y: 2 },
 { x: this.w - 3, y: this.h - 3 }
 ];
 const inStairZone = (x, y) =>
 stairZones.some((s) => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);

 for (let y = 7; y < this.h - 2; y += 3) {
 for (let x = 5; x < this.w - 5; x += 4) {
 if (inStairZone(x, y)) continue;
 if ((x + y) % 2 === 0) map[y][x] = 11;
 }
 }

 const npcs = [{
 x: 11, y: 4,
 role: 'Vendor',
 shirt: '#ec4899',
 hair: '#facc15',
 isVendor: true,
 phrase: 'Menu?',
 moveTimer: 0
 }];

 for (let i = 0; i < 4; i++) {
 npcs.push({
 x: 5 + (i * 3), y: 8,
 role: 'Aprendiz',
 shirt: ['#64748b', '#3b82f6', '#22c55e', '#eab308'][i],
 hair: ['#1e293b', '#78350f', '#000', '#facc15'][i],
 moveTimer: 9999
 });
 }

 return { z, name, map, npcs, spawns: { up: { x: 2, y: 3 }, down: { x: 2, y: 4 } } };
 }

 makeOffice(z, name) {
 const map = this.blankMap();
 this.fill(map, 0, 0, this.w, this.h, 1);
 this.fill(map, 1, 1, this.w - 2, this.h - 2, 0);

 /* Don't place desks/decor on top of where stairs will land later. */
 const stairZones = [
 { x: 2, y: 2 },
 { x: this.w - 3, y: this.h - 3 }
 ];
 const inStairZone = (x, y) =>
 stairZones.some((s) => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);

 for (let y = 3; y < this.h - 3; y += 3) {
 for (let x = 4; x < this.w - 4; x += 4) {
 if (inStairZone(x, y) || inStairZone(x + 1, y)) continue;
 if (Math.random() > 0.25) {
 map[y][x] = 5;
 if (x + 1 < this.w - 2) map[y][x + 1] = 2;
 }
 }
 }

 for (let y = 2; y < this.h - 2; y++) {
 for (let x = 2; x < this.w - 2; x++) {
 if (map[y][x] !== 0) continue;
 if (inStairZone(x, y)) continue;
 const r = Math.random();
 if (r < 0.04) map[y][x] = 9;
 else if (r < 0.07) map[y][x] = 10;
 else if (r < 0.09) map[y][x] = 12;
 }
 }

 const npcs = [];
 const count = 3 + Math.floor(Math.random() * 3);
 const shirts = ['#64748b', '#ef4444', '#22c55e', '#eab308', '#ec4899', '#3b82f6'];
 const hairs = ['#1e293b', '#78350f', '#facc15', '#fca5a5', '#000'];

 for (let i = 0; i < count; i++) {
 let placed = false;
 let attempts = 0;
 while (!placed && attempts++ < 40) {
 const rx = 4 + Math.floor(Math.random() * (this.w - 8));
 const ry = 3 + Math.floor(Math.random() * (this.h - 6));
 if (inStairZone(rx, ry)) continue;
 if (map[ry][rx] === 0 && !npcs.some(n => n.x === rx && n.y === ry)) {
 npcs.push({
 id: `npc_${z}_${i}`,
 x: rx, y: ry,
 vx: rx * CONFIG.TILE, vy: ry * CONFIG.TILE,
 /* `role` is purely cosmetic, the apprentice's
 classroom (floor name) and lesson topic carry
 the actual context. We just label them by their
 classroom for any place we surface the role. */
 role: 'Apprentice',
 classroom: name,
 moveTimer: Math.random() * 100,
 shirt: shirts[Math.floor(Math.random() * shirts.length)],
 hair: hairs[Math.floor(Math.random() * hairs.length)],
 task: null
 });
 placed = true;
 }
 }
 }

 return { z, name, map, npcs, spawns: { up: { x: 2, y: 3 }, down: { x: 2, y: 4 } } };
 }

 blankMap() {
 return Array.from({ length: this.h }, () => Array(this.w).fill(0));
 }

 fill(map, x, y, w, h, v) {
 for (let iy = y; iy < y + h; iy++) {
 for (let ix = x; ix < x + w; ix++) {
 if (map[iy] && ix < map[iy].length) map[iy][ix] = v;
 }
 }
 }
}
