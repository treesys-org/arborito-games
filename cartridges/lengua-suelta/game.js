/**
 * Lengua Suelta — match the client's requested cut against the clock
 * at the Lengua Suelta hair salon. Random lesson quiz pop-ups interrupt
 * the scissors; answer to keep going. UI chrome is English; title stays Spanish.
 */
const bindTap =
  window.arborito?.platform?.onTap ||
  ((el, fn) => {
    el.addEventListener('click', fn);
    return () => {};
  });

const GW = 56;
const GH = 64;
const TOTAL_LEVELS = 5;
/** Win when player hair matches the miniature this closely. */
const MATCH_TARGET = 78;

const TITLE = 'Lengua Suelta';

const STR = {
  title: TITLE,
  salonTag: 'Hair salon',
  topicFallback: 'Salon shift',
  startBody:
    'Welcome to <strong>Lengua Suelta</strong>. Copy the haircut in the miniature before time runs out. Clients never stop talking — random lesson questions pop up mid-cut. Right answers buy time; wrong ones cost it. Use scissors or hair extensions.',
  startBtn: 'Open the shop',
  levelChip: 'Lv. {n}',
  cutLabel: 'Match',
  previewLabel: 'Order',
  toolCut: '✂ Scissors',
  toolGrow: '💇 Hair extensions',
  quizBadge: 'Client asks!',
  chatIdle: [
    'So yeah, as I was saying…',
    'Make it look like the photo, eh?',
    "You know what's funny?",
    'My cousin said the same thing.',
    'Careful with the fringe!',
  ],
  chatQuiz: 'Wait wait — quick question!',
  chatOk: 'Nice! You know your stuff.',
  chatBad: "Nah, that's not it… keep cutting though.",
  levelWinTitle: 'Client done!',
  levelWinMsg: 'Match {cut}% · +{pts} pts · Time left {time}s',
  nextClient: 'Next client',
  nextLesson: 'Next lesson',
  retry: 'Retry shift',
  winTitle: 'Shift complete!',
  loseTitle: "Time's up!",
  loseMsg: 'The client left unhappy. Score {score} · Level {level}/{total}',
  winMsg: 'Score {score} · All {total} clients happy.',
  noBridge: "Couldn't connect to the course.",
  noLesson: "Couldn't load a lesson.",
  noQuiz: 'This lesson has no quiz — add @quiz blocks to play.',
  timeBonus: '+{n}s',
  timePenalty: '−{n}s',
};

const CLIENT_NAMES = ['Sam', 'Alex', 'Jordan', 'Riley', 'Casey', 'Quinn', 'Morgan', 'Jamie'];

const HAIR_COLORS = ['#2a1810', '#3b2416', '#5c3317', '#1a1a1a', '#6b4423', '#c4a35a'];
const SKIN_TONES = ['#e8b896', '#d4a574', '#c68642', '#f1c27d', '#8d5524'];

/** Per-level tuning: time budget, quiz cadence, hair density. */
const LEVELS = [
  { time: 55, quizMin: 11, quizMax: 16, density: 0.9, bonus: 6, penalty: 5 },
  { time: 48, quizMin: 9, quizMax: 14, density: 1.0, bonus: 5, penalty: 6 },
  { time: 42, quizMin: 8, quizMax: 12, density: 1.05, bonus: 5, penalty: 7 },
  { time: 36, quizMin: 7, quizMax: 11, density: 1.1, bonus: 4, penalty: 8 },
  { time: 30, quizMin: 6, quizMax: 10, density: 1.15, bonus: 4, penalty: 9 },
];

function resolveLang() {
  // Lesson quiz cards follow the host language; game chrome stays English.
  const raw = String(window.arborito?.user?.lang || window.arborito?.lang || 'EN').toUpperCase();
  return raw.startsWith('ES') ? 'ES' : 'EN';
}

function t(key, vars = {}) {
  let line = STR[key] ?? key;
  if (typeof line !== 'string') return line;
  Object.entries(vars).forEach(([k, v]) => {
    line = line.replaceAll(`{${k}}`, String(v));
  });
  return line;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeGrid() {
  return Array.from({ length: GH }, () => new Uint8Array(GW));
}

function fillAll(g, v) {
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) g[y][x] = v;
}

/** Face oval where hair must never cover eyes / nose / mouth. */
function inFaceZone(x, y) {
  const dx = (x - 28) / 12.5;
  const dy = (y - 35) / 12;
  return dx * dx + dy * dy < 1 && y >= 26 && y <= 46;
}

function clearFaceWindow(g) {
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      if (inFaceZone(x, y)) g[y][x] = 0;
    }
}

function inScalp(x, y) {
  return Math.hypot(x - 28, (y - 26) * 1.05) < 16.5;
}

function fullHair(g, density = 1) {
  fillAll(g, 0);
  const stretch = 19 / density;
  const longEnd = Math.min(58, Math.floor(50 + density * 4));
  for (let y = 2; y < longEnd; y++)
    for (let x = 6; x < 50; x++) {
      const top = Math.hypot((x - 28) / stretch, (y - 18) / (16 / density)) < 1;
      const crown = y < 28 && Math.hypot(x - 28, y - 20) < 15 * density;
      const long =
        y >= 28 && y < longEnd && Math.abs(x - 28) < 18 * density - (y - 28) * 0.12;
      // Sides only below brow — never fill the face oval
      const side =
        y >= 28 && y < 48 && (x <= 16 || x >= 40) && Math.abs(x - 28) < 19 * density;
      if (top || crown || long || side) g[y][x] = 1;
    }
  clearFaceWindow(g);
}

function countHair(g) {
  let n = 0;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x]) n++;
  return n;
}

function similarity(a, b) {
  let same = 0;
  let total = 0;
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      const av = a[y][x];
      const bv = b[y][x];
      if (av || bv) {
        total++;
        if (av === bv) same++;
      }
    }
  if (!total) return 100;
  let scalpSame = 0;
  let scalpN = 0;
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      if (Math.hypot(x - 28, y - 28) > 22) continue;
      scalpN++;
      if (a[y][x] === b[y][x]) scalpSame++;
    }
  const hairScore = same / total;
  const scalpScore = scalpN ? scalpSame / scalpN : 1;
  return Math.round(100 * (hairScore * 0.65 + scalpScore * 0.35));
}

const STYLES = {
  mohawk: {
    label: 'Mohawk',
    phrase: 'I want a proper punk mohawk!',
    build(g) {
      fillAll(g, 0);
      for (let y = 2; y < 28; y++) for (let x = 24; x < 32; x++) g[y][x] = 1;
      for (let y = 28; y < 36; y++)
        for (let x = 22; x < 34; x++) if (inScalp(x, y) && !inFaceZone(x, y)) g[y][x] = 1;
      clearFaceWindow(g);
    },
  },
  buzz: {
    label: 'Buzz',
    phrase: 'Buzz me almost bald, military style.',
    build(g) {
      fillAll(g, 0);
      for (let y = 14; y < 34; y++)
        for (let x = 12; x < 44; x++)
          if (inScalp(x, y) && y < 32 && Math.hypot(x - 28, y - 24) < 14) g[y][x] = 1;
      clearFaceWindow(g);
    },
  },
  bob: {
    label: 'Bob',
    phrase: 'A classic bob, please.',
    build(g) {
      fillAll(g, 0);
      for (let y = 6; y < 48; y++)
        for (let x = 8; x < 48; x++) {
          const dx = (x - 28) / 18;
          const dy = (y - 24) / 20;
          if (dx * dx + dy * dy < 1) g[y][x] = 1;
        }
      clearFaceWindow(g);
    },
  },
  bald: {
    label: 'Bald',
    phrase: 'Shave me bald, no drama.',
    build(g) {
      fillAll(g, 0);
    },
  },
  fringe: {
    label: 'Fringe',
    phrase: 'Full crown, long on the sides.',
    build(g) {
      fillAll(g, 0);
      for (let y = 4; y < 42; y++)
        for (let x = 10; x < 46; x++) {
          const top = Math.hypot(x - 28, (y - 16) * 1.1) < 16;
          const side = y > 22 && y < 44 && (x < 16 || x > 40) && Math.abs(x - 28) < 20;
          if (top || side) g[y][x] = 1;
        }
      clearFaceWindow(g);
    },
  },
  mullet: {
    label: 'Mullet',
    phrase: 'Mullet: short front, long back.',
    build(g) {
      fillAll(g, 0);
      for (let y = 8; y < 30; y++)
        for (let x = 14; x < 42; x++)
          if (Math.hypot(x - 28, y - 18) < 13) g[y][x] = 1;
      for (let y = 28; y < 56; y++)
        for (let x = 10; x < 46; x++) {
          if (Math.abs(x - 28) > 16) continue;
          if (y > 40 && Math.abs(x - 28) < 6) continue;
          g[y][x] = 1;
        }
      clearFaceWindow(g);
    },
  },
  bowl: {
    label: 'Bowl',
    phrase: 'A neat bowl cut.',
    build(g) {
      fillAll(g, 0);
      for (let y = 4; y < 34; y++)
        for (let x = 10; x < 46; x++) {
          if (Math.hypot(x - 28, y - 18) < 15.5 && y < 34) g[y][x] = 1;
        }
      clearFaceWindow(g);
    },
  },
  bangsOnly: {
    label: 'Short',
    phrase: 'Short on the crown, face clear.',
    build(g) {
      fillAll(g, 0);
      for (let y = 8; y < 28; y++)
        for (let x = 14; x < 42; x++)
          if (inScalp(x, y) && Math.hypot(x - 28, y - 20) < 12) g[y][x] = 1;
      clearFaceWindow(g);
    },
  },
};

const STYLE_KEYS = Object.keys(STYLES);

function quizKey(q) {
  return `${String(q?.question || '').trim()}|${String(q?.correct || '').trim()}`.toLowerCase();
}

function isOverviewQuestion(q) {
  const s = String(q?.question || '').toLowerCase();
  return /de qu[eé] trata|qu[eé] cubre|what is .+ about\b|what does .+ cover|what covers\b/.test(s);
}

function buildQuizzes(lesson) {
  const api = window.arborito?.challenge;
  if (!api?.fromLesson) return mockQuizzes();
  const challenges = api.fromLesson(lesson) || [];
  const modes = api.modes;
  const lang = resolveLang();
  const pool = [];
  const allWrong = [];
  const junk = new Set([': ', '\u2014', '-', '…', '...', 'N/A', 'Unknown']);

  for (const c of challenges) {
    const playable = modes?.playable?.(c) || [];
    const mode = playable.includes('multiple') ? 'multiple' : playable[0];
    if (!mode) continue;
    const card = modes.buildCard(c, mode, {
      lessonTitle: lesson.title,
      lang,
      distractorPool: challenges
        .map((ch) => {
          const play = modes?.challengeForPlay?.(ch) || ch;
          return String(play?.correct_answer || play?.short_definition || '').trim();
        })
        .filter(Boolean),
    });
    if (!card?.correct) continue;
    const correct = String(card.correct).trim();
    const cleanOpts = (card.options || [])
      .map(String)
      .map((s) => s.trim())
      .filter((s) => s && !junk.has(s));
    if (cleanOpts.length >= 2) {
      pool.push({
        question: card.question || lesson.title,
        correct,
        options: [...new Set(cleanOpts)],
        challenge: c,
        lessonId: lesson.id,
      });
      cleanOpts.forEach((o) => {
        if (o !== correct) allWrong.push(o);
      });
    } else {
      pool.push({
        question: card.question,
        correct,
        options: null,
        challenge: c,
        lessonId: lesson.id,
      });
    }
  }

  const built = pool.map((q) => {
    if (q.options?.length >= 2) return { ...q, options: shuffle(q.options) };
    const distractors = shuffle([...new Set(allWrong.filter((w) => w !== q.correct))]).slice(0, 3);
    while (distractors.length < 3) distractors.push(`?${distractors.length + 1}`);
    return { ...q, options: shuffle([q.correct, ...distractors.slice(0, 3)]) };
  });

  const meat = built.filter((q) => !isOverviewQuestion(q));
  const meta = built.filter((q) => isOverviewQuestion(q));
  return meat.length ? [...shuffle(meat), ...shuffle(meta)] : shuffle(built);
}

function mockQuizzes() {
  return [
    {
      question: 'Capital of France?',
      correct: 'Paris',
      options: shuffle(['Paris', 'Lyon', 'Marseille', 'Nice']),
      lessonId: 'mock',
    },
    {
      question: '2 + 2 = ?',
      correct: '4',
      options: shuffle(['3', '4', '5', '22']),
      lessonId: 'mock',
    },
    {
      question: 'Daytime sky color',
      correct: 'Blue',
      options: shuffle(['Blue', 'Green', 'Red', 'Black']),
      lessonId: 'mock',
    },
    {
      question: 'Opposite of cold',
      correct: 'Hot',
      options: shuffle(['Hot', 'Ice', 'Snow', 'Wind']),
      lessonId: 'mock',
    },
    {
      question: 'Days in a week?',
      correct: '7',
      options: shuffle(['5', '6', '7', '8']),
      lessonId: 'mock',
    },
  ];
}

async function expandQuizzesFromCurriculum(base, usedKeys, want = 12) {
  const list = window.arborito?.lesson?.list?.() || [];
  if (!list.length) return base;
  const out = [...base];
  const seen = new Set(usedKeys);
  for (const q of out) seen.add(quizKey(q));

  for (let i = 0; i < list.length && out.length < want; i++) {
    let lesson;
    try {
      lesson = await window.arborito.lesson.at(i);
    } catch (_) {
      continue;
    }
    if (!lesson) continue;
    for (const q of buildQuizzes(lesson)) {
      const key = quizKey(q);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(q);
      if (out.length >= want) break;
    }
  }
  return out;
}

// --- rendering helpers ---

function headLayout(w, h) {
  const cell = Math.min(w / (GW + 4), h / (GH + 6));
  const ox = (w - GW * cell) / 2;
  const oy = (h - GH * cell) / 2 + cell * 0.5;
  return { cell, ox, oy };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHeadBase(ctx, layout, opts) {
  const { cell, ox, oy } = layout;
  const cx = ox + 28 * cell;
  const cy = oy + 34 * cell;
  const skin = SKIN_TONES[opts.skin];

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, oy + 50 * cell, 7 * cell, 8 * cell, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(ox + 12 * cell, oy + 34 * cell, 2.2 * cell, 3.2 * cell, 0, 0, Math.PI * 2);
  ctx.ellipse(ox + 44 * cell, oy + 34 * cell, 2.2 * cell, 3.2 * cell, 0, 0, Math.PI * 2);
  ctx.fill();

  // Skull under the hair
  ctx.beginPath();
  ctx.ellipse(cx, cy, 13 * cell, 14.5 * cell, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Skin plate + features on top of any hair bleed over the face. */
function drawFaceFeatures(ctx, layout, opts) {
  const { cell, ox, oy } = layout;
  const cx = ox + 28 * cell;
  const skin = SKIN_TONES[opts.skin];

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, oy + 36 * cell, 11.5 * cell, 11 * cell, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2b2118';
  const eyeY = oy + 32 * cell;
  ctx.beginPath();
  ctx.ellipse(ox + 22 * cell, eyeY, 1.3 * cell, 1.6 * cell, 0, 0, Math.PI * 2);
  ctx.ellipse(ox + 34 * cell, eyeY, 1.3 * cell, 1.6 * cell, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ox + 22.4 * cell, eyeY - 0.4 * cell, 0.45 * cell, 0, Math.PI * 2);
  ctx.arc(ox + 34.4 * cell, eyeY - 0.4 * cell, 0.45 * cell, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = HAIR_COLORS[opts.hair];
  ctx.lineWidth = Math.max(1.5, cell * 0.55);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ox + 18 * cell, oy + 28.5 * cell);
  ctx.quadraticCurveTo(ox + 22 * cell, oy + 27 * cell, ox + 26 * cell, oy + 28.5 * cell);
  ctx.moveTo(ox + 30 * cell, oy + 28.5 * cell);
  ctx.quadraticCurveTo(ox + 34 * cell, oy + 27 * cell, ox + 38 * cell, oy + 28.5 * cell);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(80,50,30,.35)';
  ctx.lineWidth = Math.max(1, cell * 0.35);
  ctx.beginPath();
  ctx.moveTo(cx, oy + 33 * cell);
  ctx.quadraticCurveTo(cx + 2 * cell, oy + 37 * cell, cx, oy + 38 * cell);
  ctx.stroke();

  ctx.strokeStyle = '#a65d4a';
  ctx.lineWidth = Math.max(1.2, cell * 0.4);
  ctx.beginPath();
  if (opts.talking) {
    ctx.ellipse(cx, oy + 42 * cell, 2.2 * cell, 2.4 * cell, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(60,20,20,.35)';
    ctx.fill();
  } else {
    ctx.arc(cx, oy + 41 * cell, 3.2 * cell, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
}

/**
 * Hair clumps only outside the face oval — no "second head" over the features.
 */
function drawHair(ctx, layout, grid, color) {
  const { cell, ox, oy } = layout;
  ctx.fillStyle = color;
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      if (!grid[y][x]) continue;
      if (inFaceZone(x, y)) continue;
      const jx = ((x * 17 + y * 31) % 5) - 2;
      const jy = ((x * 13 + y * 19) % 5) - 2;
      ctx.beginPath();
      ctx.ellipse(
        ox + x * cell + cell * 0.5 + jx * 0.12,
        oy + y * cell + cell * 0.5 + jy * 0.12,
        cell * 0.68,
        cell * 0.78,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
}

function drawPerson(ctx, layout, grid, opts) {
  drawHeadBase(ctx, layout, opts);
  drawHair(ctx, layout, grid, HAIR_COLORS[opts.hair]);
  drawFaceFeatures(ctx, layout, opts);

  ctx.fillStyle = opts.shirt || '#1d5c56';
  const cx = layout.ox + 28 * layout.cell;
  ctx.beginPath();
  ctx.moveTo(cx - 14 * layout.cell, layout.oy + GH * layout.cell);
  ctx.lineTo(cx - 10 * layout.cell, layout.oy + 52 * layout.cell);
  ctx.lineTo(cx, layout.oy + 56 * layout.cell);
  ctx.lineTo(cx + 10 * layout.cell, layout.oy + 52 * layout.cell);
  ctx.lineTo(cx + 14 * layout.cell, layout.oy + GH * layout.cell);
  ctx.closePath();
  ctx.fill();
}

// --- game ---

class Game {
  constructor() {
    this.els = {
      app: document.getElementById('app'),
      start: document.getElementById('startScreen'),
      level: document.getElementById('levelScreen'),
      end: document.getElementById('endScreen'),
      canvas: document.getElementById('mainCanvas'),
      quizOverlay: document.getElementById('quizOverlay'),
      quizQ: document.getElementById('quizQ'),
      quizOpts: document.getElementById('quizOpts'),
      quizBadge: document.getElementById('quizBadge'),
      levelChip: document.getElementById('levelChip'),
      scoreChip: document.getElementById('scoreChip'),
      timeChip: document.getElementById('timeChip'),
      timerFill: document.getElementById('timer-fill'),
      cutFill: document.getElementById('cut-fill'),
      cutPct: document.getElementById('cutPct'),
      cutLabel: document.getElementById('cutLabel'),
      chatText: document.getElementById('chatText'),
      clientName: document.getElementById('clientName'),
      lessonTopic: document.getElementById('lessonTopic'),
      brandTitle: document.getElementById('brandTitle'),
      startTitle: document.getElementById('startTitle'),
      startDesc: document.getElementById('startDesc'),
      btnStart: document.getElementById('btnStart'),
      btnNextLevel: document.getElementById('btnNextLevel'),
      btnNextLesson: document.getElementById('btnNextLesson'),
      btnRetry: document.getElementById('btnRetry'),
      levelTitle: document.getElementById('levelTitle'),
      levelMsg: document.getElementById('levelMsg'),
      levelPct: document.getElementById('levelPct'),
      endTitle: document.getElementById('endTitle'),
      endMsg: document.getElementById('endMsg'),
      endPct: document.getElementById('endPct'),
      endHero: document.getElementById('endHero'),
      preview: document.getElementById('previewCanvas'),
      previewLabel: document.getElementById('previewLabel'),
      toolCut: document.getElementById('toolCut'),
      toolGrow: document.getElementById('toolGrow'),
    };
    this.ctx = this.els.canvas.getContext('2d');
    this.pctx = this.els.preview.getContext('2d');
    this.hair = makeGrid();
    this.target = makeGrid();
    this.tool = 'cut';
    this.startCount = 1;
    this.particles = [];
    this.quizzes = [];
    this.quizIdx = 0;
    this.usedQuizKeys = new Set();
    this.lesson = null;
    this.level = 0;
    this.score = 0;
    this.timeLeft = 0;
    this.timeMax = 1;
    this.playing = false;
    this.quizOpen = false;
    this.drawing = false;
    this.nextQuizAt = 0;
    this.skinTone = 0;
    this.hairColor = 0;
    this.clientName = '';
    this.styleKey = 'bob';
    this.chatTimer = 0;
    this.lastTs = 0;
    this.raf = 0;

    this.bindUi();
    this.localizeChrome();
    window.addEventListener('resize', () => this.resize());
  }

  localizeChrome() {
    this.els.brandTitle.textContent = TITLE;
    this.els.startTitle.textContent = TITLE;
    this.els.startDesc.innerHTML = t('startBody');
    this.els.btnStart.textContent = t('startBtn');
    this.els.cutLabel.textContent = t('cutLabel');
    this.els.previewLabel.textContent = t('previewLabel');
    this.els.quizBadge.textContent = t('quizBadge');
    this.els.btnNextLevel.textContent = t('nextClient');
    this.els.btnNextLesson.textContent = t('nextLesson');
    this.els.btnRetry.textContent = t('retry');
    this.els.toolCut.textContent = t('toolCut');
    this.els.toolGrow.textContent = t('toolGrow');
    const tag = document.getElementById('salonTag');
    if (tag) tag.textContent = t('salonTag');
  }

  bindUi() {
    bindTap(this.els.btnStart, () => this.beginSession());
    bindTap(this.els.btnNextLevel, () => {
      if (this.level >= TOTAL_LEVELS) this.endSession(true);
      else this.startLevel(this.level + 1);
    });
    bindTap(this.els.btnNextLesson, () => this.beginSession({ advance: true }));
    bindTap(this.els.btnRetry, () => this.beginSession({ advance: false }));

    document.querySelectorAll('.tool').forEach((btn) => {
      bindTap(btn, () => {
        this.tool = btn.dataset.tool;
        document.querySelectorAll('.tool').forEach((b) => b.classList.toggle('active', b === btn));
      });
    });

    const c = this.els.canvas;
    c.addEventListener('mousedown', (e) => this.onPointer(e, 'down'));
    c.addEventListener('mousemove', (e) => this.onPointer(e, 'move'));
    window.addEventListener('mouseup', () => {
      this.drawing = false;
    });
    c.addEventListener('touchstart', (e) => this.onPointer(e, 'down'), { passive: false });
    c.addEventListener('touchmove', (e) => this.onPointer(e, 'move'), { passive: false });
    window.addEventListener('touchend', () => {
      this.drawing = false;
    });
  }

  resize() {
    const box = document.getElementById('salon');
    if (!box) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = box.clientWidth;
    const h = box.clientHeight;
    this.els.canvas.width = Math.max(1, Math.floor(w * dpr));
    this.els.canvas.height = Math.max(1, Math.floor(h * dpr));
    this.els.canvas.style.width = `${w}px`;
    this.els.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  async beginSession({ advance = true } = {}) {
    this.els.start.classList.add('hidden');
    this.els.level.classList.add('hidden');
    this.els.end.classList.add('hidden');
    this.els.app.classList.remove('hidden');
    this.score = 0;
    this.level = 0;
    this.usedQuizKeys = new Set();
    this.localizeChrome();

    try {
      await this.loadLesson(advance);
    } catch (err) {
      this.showFatal(String(err?.message || err));
      return;
    }

    this.resize();
    this.startLevel(1);
  }

  async loadLesson(advance) {
    if (!window.arborito?.lesson) {
      this.lesson = { id: 'mock', title: t('topicFallback') };
      this.quizzes = mockQuizzes();
      this.els.lessonTopic.textContent = this.lesson.title;
      return;
    }

    let lesson = null;
    if (advance) {
      lesson = await window.arborito.lesson.next();
    } else {
      lesson = this.lesson || (await window.arborito.lesson.next());
    }
    if (!lesson) throw new Error(t('noLesson'));

    this.lesson = lesson;
    this.els.lessonTopic.textContent = lesson.title || t('topicFallback');

    let quizzes = buildQuizzes(lesson);
    if (!quizzes.length || quizzes.every(isOverviewQuestion)) {
      quizzes = await expandQuizzesFromCurriculum(quizzes, this.usedQuizKeys, 14);
    }
    if (!quizzes.length) throw new Error(t('noQuiz'));
    this.quizzes = quizzes;
    this.quizIdx = 0;
  }

  showFatal(msg) {
    this.els.app.classList.add('hidden');
    this.els.end.classList.remove('hidden');
    this.els.endHero.textContent = '⚠️';
    this.els.endTitle.textContent = t('title');
    this.els.endPct.textContent = '';
    this.els.endMsg.textContent = msg;
    this.els.btnNextLesson.classList.add('hidden');
  }

  levelCfg() {
    return LEVELS[Math.min(this.level - 1, LEVELS.length - 1)];
  }

  startLevel(n) {
    this.els.level.classList.add('hidden');
    this.els.end.classList.add('hidden');
    this.level = n;
    if (this.level > TOTAL_LEVELS) {
      this.endSession(true);
      return;
    }

    const cfg = this.levelCfg();
    const names = CLIENT_NAMES;
    this.clientName = names[(this.level + (this.lesson?.id?.length || 0)) % names.length];
    this.skinTone = Math.floor(Math.random() * SKIN_TONES.length);
    this.hairColor = Math.floor(Math.random() * HAIR_COLORS.length);
    this.styleKey = STYLE_KEYS[(this.level * 2 + Math.floor(Math.random() * STYLE_KEYS.length)) % STYLE_KEYS.length];

    this.target = makeGrid();
    STYLES[this.styleKey].build(this.target);

    this.hair = makeGrid();
    fullHair(this.hair, cfg.density);
    this.startCount = Math.max(1, countHair(this.hair));
    this.particles = [];
    this.timeMax = cfg.time;
    this.timeLeft = cfg.time;
    this.playing = true;
    this.quizOpen = false;
    this.els.quizOverlay.classList.add('hidden');
    this.scheduleNextQuiz();
    this.chatTimer = 2;

    const style = STYLES[this.styleKey];
    this.setChat(style.phrase);

    this.els.levelChip.textContent = t('levelChip', { n: this.level });
    this.els.scoreChip.textContent = `★ ${this.score}`;
    this.els.clientName.textContent = `${this.clientName} · ${style.label}`;
    this.drawPreview();
    this.updateHud();
    this.lastTs = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame((ts) => this.tick(ts));
    this.draw();
  }

  pickIdle() {
    const lines = STR.chatIdle;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  setChat(text) {
    this.els.chatText.textContent = text;
  }

  scheduleNextQuiz() {
    const cfg = this.levelCfg();
    const gap = cfg.quizMin + Math.random() * (cfg.quizMax - cfg.quizMin);
    this.nextQuizAt = this.timeLeft - gap;
  }

  matchPct() {
    return similarity(this.hair, this.target);
  }

  updateHud() {
    const secs = Math.max(0, Math.ceil(this.timeLeft));
    const m = Math.floor(secs / 60);
    const s = String(secs % 60).padStart(2, '0');
    this.els.timeChip.textContent = `${m}:${s}`;
    this.els.timeChip.classList.toggle('urgent', this.timeLeft <= 8 && this.playing);

    const ratio = Math.max(0, Math.min(1, this.timeLeft / this.timeMax));
    this.els.timerFill.style.transform = `scaleX(${ratio})`;
    this.els.timerFill.classList.toggle('low', ratio < 0.28);

    const match = this.matchPct();
    this.els.cutFill.style.width = `${match}%`;
    this.els.cutPct.textContent = `${match}%`;
  }

  tick(ts) {
    if (!this.playing) return;
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;

    if (!this.quizOpen) {
      this.timeLeft -= dt;
      this.chatTimer -= dt;
      if (this.chatTimer <= 0) {
        this.setChat(this.pickIdle());
        this.chatTimer = 3.5 + Math.random() * 3;
      }
      if (this.timeLeft <= this.nextQuizAt && this.quizzes.length) {
        this.openQuiz();
      }
    }

    // particles always
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.04;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    this.updateHud();
    this.draw();

    if (!this.quizOpen && this.matchPct() >= MATCH_TARGET) {
      this.winLevel();
      return;
    }
    if (!this.quizOpen && this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endSession(false);
      return;
    }

    this.raf = requestAnimationFrame((t2) => this.tick(t2));
  }

  openQuiz() {
    if (!this.quizzes.length) return;
    this.quizOpen = true;
    this.drawing = false;
    this.setChat(t('chatQuiz'));

    let q = this.quizzes[this.quizIdx % this.quizzes.length];
    let tries = 0;
    while (this.usedQuizKeys.has(quizKey(q)) && tries < this.quizzes.length) {
      this.quizIdx++;
      q = this.quizzes[this.quizIdx % this.quizzes.length];
      tries++;
    }
    this.currentQuiz = q;
    this.els.quizQ.textContent = q.question;
    this.els.quizOpts.innerHTML = '';
    const opts = shuffle([...(q.options || [q.correct])]).slice(0, 4);
    if (!opts.includes(q.correct)) opts[0] = q.correct;

    for (const opt of shuffle(opts)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'qopt';
      btn.textContent = opt;
      bindTap(btn, () => this.answerQuiz(opt, btn));
      this.els.quizOpts.appendChild(btn);
    }
    this.els.quizOverlay.classList.remove('hidden');
    this.draw();
  }

  answerQuiz(opt, btn) {
    if (!this.quizOpen || !this.currentQuiz) return;
    const q = this.currentQuiz;
    const ok = String(opt).trim() === String(q.correct).trim();
    const cfg = this.levelCfg();

    // lock buttons
    [...this.els.quizOpts.children].forEach((b) => {
      b.style.pointerEvents = 'none';
      if (String(b.textContent).trim() === String(q.correct).trim()) b.classList.add('ok');
    });
    if (!ok) btn.classList.add('bad');

    this.usedQuizKeys.add(quizKey(q));
    this.quizIdx++;

    if (q.lessonId && q.lessonId !== 'mock' && window.arborito?.memory?.report) {
      try {
        window.arborito.memory.report(q.lessonId, ok ? 4 : 1);
      } catch (_) {}
    }
    if (ok && window.arborito?.xp) {
      try {
        window.arborito.xp(8);
      } catch (_) {}
    }

    if (ok) {
      this.timeLeft = Math.min(this.timeMax + 8, this.timeLeft + cfg.bonus);
      this.score += 15;
      this.setChat(t('chatOk') + ' ' + t('timeBonus', { n: cfg.bonus }));
    } else {
      this.timeLeft = Math.max(1, this.timeLeft - cfg.penalty);
      // grow a little hair back as chaos
      this.regrowHair(0.06);
      this.setChat(t('chatBad') + ' ' + t('timePenalty', { n: cfg.penalty }));
    }
    this.els.scoreChip.textContent = `★ ${this.score}`;

    setTimeout(() => {
      this.els.quizOverlay.classList.add('hidden');
      this.quizOpen = false;
      this.currentQuiz = null;
      this.scheduleNextQuiz();
      this.lastTs = performance.now();
      this.raf = requestAnimationFrame((ts) => this.tick(ts));
    }, 550);
  }

  regrowHair(frac) {
    const want = Math.floor(this.startCount * frac);
    let added = 0;
    for (let y = 4; y < 50 && added < want; y++)
      for (let x = 10; x < 46 && added < want; x++) {
        if (this.hair[y][x] || inFaceZone(x, y)) continue;
        if (Math.hypot((x - 28) / 18, (y - 18) / 14) < 1 && Math.random() < 0.35) {
          this.hair[y][x] = 1;
          added++;
        }
      }
    clearFaceWindow(this.hair);
  }

  winLevel() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
    const cut = this.matchPct();
    const timeBonus = Math.round(this.timeLeft);
    const pts = 40 + timeBonus * 2 + this.level * 10 + Math.max(0, cut - MATCH_TARGET);
    this.score += pts;
    this.els.scoreChip.textContent = `★ ${this.score}`;

    if (this.lesson?.id && this.lesson.id !== 'mock' && window.arborito?.memory?.report) {
      try {
        window.arborito.memory.report(this.lesson.id, 3);
      } catch (_) {}
    }
    if (window.arborito?.xp) {
      try {
        window.arborito.xp(pts);
      } catch (_) {}
    }

    this.els.levelPct.textContent = `${cut}%`;
    this.els.levelPct.className = 'pct';
    this.els.levelTitle.textContent = t('levelWinTitle');
    this.els.levelMsg.textContent = t('levelWinMsg', {
      cut,
      pts,
      time: timeBonus,
    });
    this.els.btnNextLevel.textContent =
      this.level >= TOTAL_LEVELS ? t('nextLesson') : t('nextClient');
    this.els.level.classList.remove('hidden');
  }

  endSession(won) {
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.els.quizOverlay.classList.add('hidden');
    this.els.level.classList.add('hidden');
    this.els.end.classList.remove('hidden');
    this.els.btnNextLesson.classList.remove('hidden');

    this.els.endHero.textContent = won ? '🏆' : '😅';
    this.els.endTitle.textContent = won ? t('winTitle') : t('loseTitle');
    this.els.endPct.textContent = String(this.score);
    this.els.endPct.className = 'pct' + (won ? '' : ' meh');
    this.els.endMsg.textContent = won
      ? t('winMsg', { score: this.score, total: TOTAL_LEVELS })
      : t('loseMsg', { score: this.score, level: this.level, total: TOTAL_LEVELS });

    if (won && this.lesson?.id && this.lesson.id !== 'mock' && window.arborito?.memory?.report) {
      try {
        window.arborito.memory.report(this.lesson.id, 4);
      } catch (_) {}
    }
  }

  onPointer(e, phase) {
    if (!this.playing || this.quizOpen) return;
    e.preventDefault();
    if (phase === 'down') this.drawing = true;
    if (!this.drawing) return;
    const { gx, gy } = this.gridFromEvent(e);
    this.brush(gx, gy);
    this.draw();
    this.updateHud();
  }

  gridFromEvent(e) {
    const rect = this.els.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const layout = headLayout(rect.width, rect.height);
    return {
      gx: Math.floor((clientX - rect.left - layout.ox) / layout.cell),
      gy: Math.floor((clientY - rect.top - layout.oy) / layout.cell),
    };
  }

  brush(gx, gy) {
    const r = this.tool === 'cut' ? 2.5 : 2.1;
    const r2 = r * r;
    const layout = headLayout(this.els.canvas.clientWidth, this.els.canvas.clientHeight);
    const value = this.tool === 'cut' ? 0 : 1;
    for (let y = Math.floor(gy - r); y <= gy + r; y++)
      for (let x = Math.floor(gx - r); x <= gx + r; x++) {
        if (x < 0 || y < 0 || x >= GW || y >= GH) continue;
        if ((x - gx) * (x - gx) + (y - gy) * (y - gy) > r2) continue;
        if (value === 1 && inFaceZone(x, y)) continue;
        if (value === 0 && this.hair[y][x]) {
          this.hair[y][x] = 0;
          if (Math.random() < 0.35) {
            this.particles.push({
              x: layout.ox + (x + 0.5) * layout.cell,
              y: layout.oy + (y + 0.5) * layout.cell,
              vx: (Math.random() - 0.5) * 3,
              vy: Math.random() * 2 + 1,
              life: 1,
              color: HAIR_COLORS[this.hairColor],
            });
          }
        } else if (value === 1) {
          this.hair[y][x] = 1;
        }
      }
    clearFaceWindow(this.hair);
  }

  drawPreview() {
    const canvas = this.els.preview;
    const ctx = this.pctx;
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#8b6b4a';
    ctx.fillRect(0, 0, w, h);
    const layout = {
      cell: Math.min(w / GW, h / GH) * 0.92,
      ox: 0,
      oy: 0,
    };
    layout.ox = (w - GW * layout.cell) / 2;
    layout.oy = (h - GH * layout.cell) / 2;
    drawPerson(ctx, layout, this.target, {
      skin: this.skinTone,
      hair: this.hairColor,
      talking: false,
      shirt: '#1d5c56',
    });
  }

  draw() {
    const w = this.els.canvas.clientWidth;
    const h = this.els.canvas.clientHeight;
    if (!w || !h) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    const mw = Math.min(w * 0.72, h * 0.78);
    const mh = mw * 1.15;
    const mx = (w - mw) / 2;
    const my = (h - mh) / 2 - 8;
    ctx.fillStyle = 'rgba(220,230,235,.18)';
    roundRect(ctx, mx, my, mw, mh, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(210,200,190,.7)';
    ctx.lineWidth = 4;
    ctx.stroke();

    const layout = headLayout(w, h);
    drawPerson(ctx, layout, this.hair, {
      skin: this.skinTone,
      hair: this.hairColor,
      talking: this.quizOpen,
      shirt: '#1d5c56',
    });

    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 5);
      ctx.globalAlpha = 1;
    }
  }
}

const game = new Game();
fullHair(game.hair, 1);
STYLES.bob.build(game.target);
game.skinTone = 1;
game.hairColor = 2;
game.resize();
game.drawPreview();
requestAnimationFrame(() => game.draw());
