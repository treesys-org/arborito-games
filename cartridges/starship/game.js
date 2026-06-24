import { SpaceEngine } from './space.js';
import { PlatformerEngine } from './platformer.js';
import { StoryEngine } from './story.js';
import { InputManager, bindMobileTap } from './utils.js';

/* Platform helpers come from the SDK (window.arborito.platform.*).
 * Aliased so the rest of the file keeps its existing names. */
const _platform = (window.arborito && window.arborito.platform) || {};
const getViewportSize = _platform.getScreenSize || (() => ({ width: window.innerWidth, height: window.innerHeight }));
const initViewportListeners = _platform.onScreenChange || (() => () => {});

/** Starship cartridge: prologue → space flight → planet platformer modes. */
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        const { width, height } = getViewportSize();
        this.width = width;
        this.height = height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.input = new InputManager();
        this.particles = [];
        this.mode = 'prologue';
        this.shakeTimer = 0;
        this.time = 0;
        this.vignetteCanvas = null;

        this.space = new SpaceEngine(this);
        this.planet = new PlatformerEngine(this);
        this.story = new StoryEngine(this);

        this.initListeners();
        this.startSequence();

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    updatePortraitHint() {
        const portrait = window.matchMedia('(orientation: portrait)').matches;
        document.body.classList.toggle('portrait-hint', portrait);
    }

    initListeners() {
        const onViewportChange = () => {
            const { width, height } = getViewportSize();
            this.width = width;
            this.height = height;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.space.resetJoystick();
            this.vignetteCanvas = null;
            this.updatePortraitHint();
        };
        const canvasHost = this.canvas.parentElement;
        initViewportListeners(onViewportChange, canvasHost || this.canvas);

        bindMobileTap(document.getElementById('btn-start'), () => {
            document.getElementById('prologue-screen').classList.add('hidden');
            document.body.classList.add('in-game');
            this.updatePortraitHint();
            this.switchMode('space');
            this.story.onGameStart();
        });

        bindMobileTap(document.getElementById('btn-respawn'), () => {
            document.getElementById('death-screen').classList.add('hidden');
            this.planet.loadLevel(this.space.activePlanet);
        });
    }

    async startSequence() {
        /* Parent frame injects window.arborito asynchronously; poll before building the galaxy. */
        const waitForSdk = () => new Promise((resolve) => {
            if (window.arborito) {
                resolve();
                return;
            }
            let attempts = 0;
            const check = setInterval(() => {
                attempts++;
                if (window.arborito || attempts > 40) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });
        await waitForSdk();
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('prologue-screen').classList.remove('hidden');

        const list = window.arborito ? window.arborito.lesson.list() : this.mockLessons();
        this.space.generateGalaxy(list);
        this.story.updateQuestUI();
    }

    mockLessons() {
        return Array.from({ length: 12 }, (_, i) => ({
            id: i,
            index: i,
            title: `Lección ${i + 1}: Fundamentos`,
            text: 'Los Sabios Marcianos guardaron este conocimiento en cristales resonantes. Recupéralo antes de que el Coro del Vacío lo devore.'
        }));
    }

    switchMode(mode) {
        this.mode = mode;
        this.input.reset();

        /* Keep story.returnMode in sync so a subsequent dialogue line doesn't
           push the loop back into planet.update() once we've left the planet. */
        if (this.story) this.story._returnMode = mode;

        if (mode === 'space') {
            document.getElementById('ui-space').classList.remove('hidden');
            document.getElementById('ui-planet').classList.add('hidden');
            this.space.resetJoystick();
            this.story.updateQuestUI();
            this.showControlToast('space');
        } else if (mode === 'planet') {
            document.getElementById('ui-space').classList.add('hidden');
            document.getElementById('ui-planet').classList.remove('hidden');
            this.story.onPlanetLanding(this.space.activePlanet);
            this.planet.loadLevel(this.space.activePlanet);
            this.showControlToast('planet');
        }
    }

    /** Show a transient list of controls the first time the player enters
     *  each mode in this session — many people skip the prologue and then
     *  can't figure out how to shoot or land. Auto-dismisses after 7s or
     *  on first input. */
    showControlToast(mode) {
        if (!this._toastShown) this._toastShown = {};
        if (this._toastShown[mode]) return;
        this._toastShown[mode] = true;

        const toast = document.getElementById('control-toast');
        const body = document.getElementById('control-toast-body');
        if (!toast || !body) return;

        const kbd = (label) => `<kbd>${label}</kbd>`;
        const row = (keys, desc) => `<div>${keys.map(kbd).join(' / ')} <span style="color:#94a3b8">${desc}</span></div>`;

        if (mode === 'space') {
            body.innerHTML = [
                row(['R'], '— disparar 🔫'),
                row(['W', '↑'], '— propulsar'),
                row(['A', 'D'], '— girar'),
                row(['Shift'], '— warp'),
                row(['Space'], '— aterrizar (cerca de planeta)')
            ].join('');
        } else if (mode === 'planet') {
            body.innerHTML = [
                row(['R'], '— disparar bláster 🔫'),
                row(['A', 'D', '←', '→'], '— moverse'),
                row(['W', '↑', 'Space'], '— saltar'),
                row(['E', '↑', 'Enter'], '— hablar / interactuar'),
                row(['Z', 'Enter'], '— despegar (cerca de la nave)')
            ].join('');
        } else {
            return;
        }

        toast.classList.remove('hidden');
        requestAnimationFrame(() => toast.classList.add('visible'));

        const dismiss = () => {
            toast.classList.remove('visible');
            setTimeout(() => toast.classList.add('hidden'), 500);
            window.removeEventListener('keydown', dismiss);
            window.removeEventListener('pointerdown', dismiss);
            clearTimeout(this._toastTimer);
        };
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(dismiss, 7000);
        window.addEventListener('keydown', dismiss, { once: true });
        window.addEventListener('pointerdown', dismiss, { once: true });
    }

    spawnParticle(x, y, color, speed = 1, size = 3) {
        if (this.particles.length >= 80) this.particles.shift();
        this.particles.push({
            x, y, color,
            life: 1.0,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            size
        });
    }

    ensureVignette() {
        if (this.vignetteCanvas && this.vignetteCanvas.width === this.width) return this.vignetteCanvas;
        const c = document.createElement('canvas');
        c.width = this.width;
        c.height = this.height;
        const ctx = c.getContext('2d');
        const vig = ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.height * 0.3,
            this.width / 2, this.height / 2, this.height * 0.8
        );
        vig.addColorStop(0, 'transparent');
        vig.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, this.width, this.height);
        this.vignetteCanvas = c;
        return c;
    }

    shake(amount) {
        this.shakeTimer = amount;
    }

    loop() {
        this.time++;

        if (this.mode === 'space') {
            this.space.update();
        } else if (this.mode === 'planet') {
            this.planet.update();
        } else if (this.mode === 'story' && this.story._returnMode === 'planet') {
            this.planet.update();
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.03;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        this.ctx.save();

        if (this.shakeTimer > 0) {
            const mag = this.shakeTimer;
            this.ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
            this.shakeTimer *= 0.9;
            if (this.shakeTimer < 0.5) this.shakeTimer = 0;
        }

        if (this.mode === 'planet' || (this.mode === 'story' && this.story._returnMode === 'planet')) {
            this.planet.draw(this.ctx);
        } else if (this.mode === 'space' || this.mode === 'story') {
            this.space.draw(this.ctx);
        }

        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        this.ctx.drawImage(this.ensureVignette(), 0, 0);

        this.ctx.restore();
        requestAnimationFrame(this.loop);
    }
}

new Game();
