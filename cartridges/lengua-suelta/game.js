/**
 * Lengua Suelta — match the client's requested cut against the clock
 * at the Lengua Suelta hair salon. Random lesson quiz pop-ups interrupt
 * the scissors; answer to keep going. UI follows host language (EN/ES).
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
/** Pass mark when the cut is handed in (button or timer). No auto-win on match %. */
const MATCH_TARGET = 70;

const TITLE = 'Lengua Suelta';

const STR = {
  EN: {
    title: TITLE,
    salonTag: 'Hair salon',
    topicFallback: 'Salon shift',
    clientFallback: 'Client',
    startBody:
      'Welcome to <strong>Lengua Suelta</strong>. Copy the haircut in the miniature, then hand it in — or keep refining until the timer delivers it for you. Clients never stop talking — random lesson questions pop up mid-cut. Right answers buy time; wrong ones cost it. Use scissors or hair extensions.',
    startBtn: 'Open the shop',
    levelChip: 'Lv. {n}',
    cutLabel: 'Match',
    previewLabel: 'Order',
    toolCut: '✂ Scissors',
    toolGrow: '💇 Hair extensions',
    finishCut: '✓ Hand in cut',
    quizBadge: 'While you cut…',
    chatStudy:
      'I was just studying «{topic}» — mind if I chat about it while you cut?',
    handInTitle: 'Cut handed in!',
    handInMsg: 'Match {cut}% · +{pts} pts · Early hand-in',
    chatIdle: [
      'So yeah, as I was saying…',
      'Make it look like the photo, eh?',
      "You know what's funny?",
      'My cousin said the same thing.',
      'Careful with the fringe!',
      'Don’t take too much off the top.',
      'I have a date after this, no pressure.',
      'Last time they cut it way too short.',
      'Can you hurry a tiny bit? Parking meter.',
      'My boss is going to notice this one.',
      'Leave the ears free, please.',
      'I saw this cut on a show last night.',
      'If it looks weird I’ll just wear a hat.',
      'Is the shop always this busy?',
      'Tell me when to tilt my head.',
      'I trust you… mostly.',
      'Same as the miniature, nothing fancy.',
      'My partner booked this appointment.',
      'Oops — was that a quiz? Keep going!',
      'Coffee after? Kidding, focus on the cut.',
    ],
    chatQuiz: [
      'Oh wait — quick thing while you cut…',
      'By the way, real quick…',
      'Don’t stop cutting, just tell me…',
      'Ah! That reminded me…',
    ],
    quizLeads: [
      'Oh by the way — do you remember this?',
      'Ah, quick one while you’re at it…',
      'Don’t mind me chatting — what about this?',
      'My cousin asked me this yesterday…',
      'Totally random, but…',
      'While you’ve got the scissors — help me out:',
    ],
    quizLeadsTopic: [
      'Oh by the way — do you remember {x}?',
      'Ah! Speaking of {x}…',
      'Quick: what do you know about {x}?',
      'My cousin was asking about {x}…',
    ],
    quizLeadsOrder: [
      'Help me get this in the right order…',
      'Wait — how does this go again?',
      'Talk me through the order, real quick…',
    ],
    quizLeadsCloze: [
      'Finish this thought for me…',
      'There’s a blank in my head — fill it in?',
      'How would you complete this?',
    ],
    chatOk: [
      'Nice! You know your stuff.',
      'Yes! That’s what I meant.',
      'Ha — correct. Keep cutting.',
      'Okay brainiac, back to the scissors.',
      'See? I knew you’d get it.',
    ],
    chatBad: [
      "Nah, that's not it… keep cutting though.",
      'Wrong — but the hair still needs work.',
      'Nope. Don’t freeze, keep going.',
      'Missed it. Timer doesn’t care.',
      'Hmm, not quite — scissors first though.',
    ],
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
  },
  ES: {
    title: TITLE,
    salonTag: 'Peluquería',
    topicFallback: 'Turno en el salón',
    clientFallback: 'Cliente',
    startBody:
      'Bienvenido/a a <strong>Lengua Suelta</strong>. Copia el corte de la miniatura y entrégalo — o sigue retocando hasta que el reloj lo entregue por ti. Los clientes no paran de hablar: preguntas al azar de la lección aparecen a mitad del corte. Si aciertas, ganas tiempo; si fallas, lo pierdes. Usa la tijera o las extensiones.',
    startBtn: 'Abrir el salón',
    levelChip: 'Niv. {n}',
    cutLabel: 'Parecido',
    previewLabel: 'Pedido',
    toolCut: '✂ Tijera',
    toolGrow: '💇 Extensiones',
    finishCut: '✓ Entregar corte',
    quizBadge: 'Mientras cortas…',
    chatStudy:
      'Estaba estudiando «{topic}» — ¿te importa si te pregunto cosas mientras cortas?',
    handInTitle: '¡Corte entregado!',
    handInMsg: 'Parecido {cut}% · +{pts} pts · Entrega anticipada',
    chatIdle: [
      'Bueno, como te decía…',
      'Que quede igualito a la foto, ¿eh?',
      '¿Sabes qué es lo gracioso?',
      'Mi primo dijo lo mismo.',
      '¡Cuidado con el flequillo!',
      'No me saques demasiado de arriba.',
      'Tengo una cita después, sin presión.',
      'La última vez me lo dejaron demasiado corto.',
      '¿Puedes apurarte un poco? El parquímetro.',
      'Mi jefe se va a dar cuenta de este corte.',
      'Deja las orejas libres, por favor.',
      'Vi este corte en una serie anoche.',
      'Si queda raro me pongo un gorro y listo.',
      '¿Siempre hay tanta gente en el salón?',
      'Avísame cuándo inclinar la cabeza.',
      'Confío en ti… más o menos.',
      'Igual a la miniatura, nada raro.',
      'Mi pareja me sacó la cita.',
      'Uy — ¿era una pregunta? Sigue igual.',
      '¿Café después? Es broma, mira el corte.',
    ],
    chatQuiz: [
      'Espera un momento — una cosita mientras cortas…',
      'Ah, por cierto, rapidito…',
      'No pares la tijera, solo dime…',
      '¡Ah! Eso me recordó algo…',
    ],
    quizLeads: [
      'Ah, por cierto — ¿te acuerdas de esto?',
      'Una duda rápida mientras estás…',
      'Perdón que hable tanto, pero…',
      'Mi primo me preguntó esto ayer…',
      'Totalmente al azar, pero…',
      'Ya que tienes la tijera — ayúdame:',
    ],
    quizLeadsTopic: [
      'Ah, por cierto — ¿te acuerdas de {x}?',
      '¡Ah! Hablando de {x}…',
      'Rápido: ¿qué sabes de {x}?',
      'Mi primo preguntaba por {x}…',
    ],
    quizLeadsOrder: [
      'Ayúdame a poner esto en orden…',
      'Espera — ¿cómo era el orden?',
      'Explícame el orden, rapidito…',
    ],
    quizLeadsCloze: [
      'Complétame esta frase…',
      'Tengo un hueco en la cabeza — ¿lo llenas?',
      '¿Cómo terminarías esto?',
    ],
    chatOk: [
      '¡Bien! Sabes del tema.',
      '¡Eso! Justo lo que pensaba.',
      'Ja — correcta. Sigue con la tijera.',
      'Ok, genio, de vuelta al corte.',
      '¿Viste? Sabía que lo tenías.',
    ],
    chatBad: [
      'No, no era eso… sigue cortando igual.',
      'Incorrecto — pero el pelo sigue pidiendo tijera.',
      'No. No te congeles, sigue.',
      'Fallaste. El reloj no perdona.',
      'Mmm, no del todo — primero la tijera.',
    ],
    levelWinTitle: '¡Cliente listo!',
    levelWinMsg: 'Parecido {cut}% · +{pts} pts · Tiempo restante {time}s',
    nextClient: 'Siguiente cliente',
    nextLesson: 'Siguiente lección',
    retry: 'Reintentar turno',
    winTitle: '¡Turno completo!',
    loseTitle: '¡Se acabó el tiempo!',
    loseMsg: 'El cliente se fue molesto. Puntos {score} · Nivel {level}/{total}',
    winMsg: 'Puntos {score} · Los {total} clientes felices.',
    noBridge: 'No se pudo conectar con el curso.',
    noLesson: 'No se pudo cargar una lección.',
    noQuiz: 'Esta lección no tiene cuestionario: añade bloques @quiz para jugar.',
    timeBonus: '+{n}s',
    timePenalty: '−{n}s',
  },
};

/** Haircut names and client order lines, keyed by style id. */
const STYLE_COPY = {
  EN: {
    mohawk: {
      label: 'Mohawk',
      phrases: [
        'I want a proper punk mohawk!',
        'Tall strip down the middle — sides gone.',
        'Make it loud. Mohawk, please.',
      ],
    },
    buzz: {
      label: 'Buzz',
      phrases: [
        'Buzz me almost bald, military style.',
        'Short all over. No fluff.',
        'Keep it neat and tight — buzz cut.',
      ],
    },
    bob: {
      label: 'Bob',
      phrases: [
        'A classic bob, please.',
        'Chin-length, even all around.',
        'Bob cut — clean and simple.',
      ],
    },
    bald: {
      label: 'Bald',
      phrases: [
        'Shave me bald, no drama.',
        'All of it off. Smooth.',
        'Bald. Like, actually bald.',
      ],
    },
    fringe: {
      label: 'Fringe',
      phrases: [
        'Full crown, long on the sides.',
        'Keep the sides hanging.',
        'Volume on top, length at the ears.',
      ],
    },
    mullet: {
      label: 'Mullet',
      phrases: [
        'Mullet: short front, long back.',
        'Business in front, party in the back.',
        'Yes, a real mullet. Commit.',
      ],
    },
    bowl: {
      label: 'Bowl',
      phrases: [
        'A neat bowl cut.',
        'Round and tidy — bowl style.',
        'Like a bowl sat on my head. Perfect.',
      ],
    },
    bangsOnly: {
      label: 'Short',
      phrases: [
        'Short on the crown, face clear.',
        'Just a little on top.',
        'Short crown — nothing over the eyes.',
      ],
    },
    ponytail: {
      label: 'Ponytail',
      phrases: [
        'Pull it back into a ponytail.',
        'Crown neat, one long tail behind.',
        'Ponytail energy. Let’s go.',
      ],
    },
    spikes: {
      label: 'Spikes',
      phrases: [
        'Spiky on top — like a hedgehog.',
        'Pointy tips, please.',
        'I want spikes. Several of them.',
      ],
    },
    afro: {
      label: 'Afro',
      phrases: [
        'Big round afro — full volume.',
        'Fluffy sphere. Don’t flatten it.',
        'Give me that round cloud.',
      ],
    },
    undercut: {
      label: 'Undercut',
      phrases: [
        'Flat top, sides shaved clean.',
        'Undercut: top stays, sides go.',
        'Hard part vibes — undercut.',
      ],
    },
    sidePart: {
      label: 'Side part',
      phrases: [
        'Sweep it all to one side.',
        'Heavy side part, please.',
        'Most of the hair on the left.',
      ],
    },
    longLocks: {
      label: 'Long',
      phrases: [
        'Leave it long — almost to the shoulders.',
        'I want length. Lots of it.',
        'Long locks, face still free.',
      ],
    },
    topKnot: {
      label: 'Top knot',
      phrases: [
        'Bun on top — top knot.',
        'Little knot up high.',
        'Tie it up. Top knot only.',
      ],
    },
    curtain: {
      label: 'Curtain',
      phrases: [
        'Middle part, curtains on both sides.',
        'Open the face — curtain bangs.',
        'Split in the middle, soft sides.',
      ],
    },
    crew: {
      label: 'Crew',
      phrases: [
        'Flat crew cut — short and square.',
        'Crew: neat box on top.',
        'Short flat top, nothing wild.',
      ],
    },
    horns: {
      label: 'Horns',
      phrases: [
        'Two little horns on the sides. Fun.',
        'Devil-horn tufts — go for it.',
        'I know it’s weird. Horns.',
      ],
    },
  },
  ES: {
    mohawk: {
      label: 'Mohicano',
      phrases: [
        '¡Quiero un mohicano bien punk!',
        'Una franja alta al medio — lados a cero.',
        'Que se note. Mohicano, por favor.',
      ],
    },
    buzz: {
      label: 'Rapeado',
      phrases: [
        'Rápame casi calvo, estilo militar.',
        'Corto por todos lados. Sin volumen.',
        'Ordenado y al ras — rapeado.',
      ],
    },
    bob: {
      label: 'Bob',
      phrases: [
        'Un bob clásico, por favor.',
        'Hasta la mandíbula, parejo.',
        'Bob limpio y simple.',
      ],
    },
    bald: {
      label: 'Calvo',
      phrases: [
        'Aféitame al ras, sin drama.',
        'Todo fuera. Suave.',
        'Calvo. En serio, calvo.',
      ],
    },
    fringe: {
      label: 'Flequillo',
      phrases: [
        'Corona llena, largo a los lados.',
        'Deja los lados colgando.',
        'Volumen arriba, largo en las orejas.',
      ],
    },
    mullet: {
      label: 'Mullet',
      phrases: [
        'Mullet: corto adelante, largo atrás.',
        'Negocios adelante, fiesta atrás.',
        'Sí, un mullet de verdad. Comprométete.',
      ],
    },
    bowl: {
      label: 'Tazón',
      phrases: [
        'Un corte de tazón ordenado.',
        'Redondo y cuidado — estilo tazón.',
        'Como si me hubieran puesto un bowl. Perfecto.',
      ],
    },
    bangsOnly: {
      label: 'Corto',
      phrases: [
        'Corto en la coronilla, cara libre.',
        'Solo un poquito arriba.',
        'Coronilla corta — nada sobre los ojos.',
      ],
    },
    ponytail: {
      label: 'Cola',
      phrases: [
        'Átame el pelo en una cola atrás.',
        'Corona ordenada y una cola larga.',
        'Estilo cola de caballo. Vamos.',
      ],
    },
    spikes: {
      label: 'Picos',
      phrases: [
        'Con picos arriba — tipo erizo.',
        'Puntitas, por favor.',
        'Quiero picos. Varios.',
      ],
    },
    afro: {
      label: 'Afro',
      phrases: [
        'Afro grande — máximo volumen.',
        'Esfera esponjosa. No lo aplastes.',
        'Dame esa nube redonda.',
      ],
    },
    undercut: {
      label: 'Undercut',
      phrases: [
        'Arriba plano, lados afeitados.',
        'Undercut: arriba queda, lados fuera.',
        'Estilo undercut bien marcado.',
      ],
    },
    sidePart: {
      label: 'Raya al lado',
      phrases: [
        'Todo peinado hacia un lado.',
        'Raya profunda al lado, por favor.',
        'La mayor parte del pelo a la izquierda.',
      ],
    },
    longLocks: {
      label: 'Largo',
      phrases: [
        'Déjalo largo — casi hasta los hombros.',
        'Quiero largo. Bastante.',
        'Melena larga, cara libre igual.',
      ],
    },
    topKnot: {
      label: 'Moño',
      phrases: [
        'Un moño arriba — top knot.',
        'Nudo pequeño bien alto.',
        'Átame el pelo arriba. Solo el moño.',
      ],
    },
    curtain: {
      label: 'Cortina',
      phrases: [
        'Raya al medio, cortinas a los lados.',
        'Abre la cara — flequillo cortina.',
        'Partido al medio, lados suaves.',
      ],
    },
    crew: {
      label: 'Crew',
      phrases: [
        'Crew plano — corto y cuadrado.',
        'Crew: cajita ordenada arriba.',
        'Corte crew corto, nada exagerado.',
      ],
    },
    horns: {
      label: 'Cuernitos',
      phrases: [
        'Dos cuernitos a los lados. Por diversión.',
        'Mechones tipo diablo — adelante.',
        'Sé que es raro. Cuernos.',
      ],
    },
  },
};

const CLIENT_NAMES = [
  'Sam',
  'Alex',
  'Jordan',
  'Riley',
  'Casey',
  'Quinn',
  'Morgan',
  'Jamie',
  'Taylor',
  'Avery',
  'Reese',
  'Cameron',
  'Drew',
  'Skyler',
  'Parker',
  'Kai',
];

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
  const raw = String(window.arborito?.user?.lang || window.arborito?.lang || 'EN').toUpperCase();
  return raw.startsWith('ES') ? 'ES' : 'EN';
}

function t(key, vars = {}) {
  const lang = resolveLang();
  let line = STR[lang]?.[key] ?? STR.EN[key] ?? key;
  if (typeof line !== 'string') return key;
  Object.entries(vars).forEach(([k, v]) => {
    line = line.replaceAll(`{${k}}`, String(v));
  });
  return line;
}

function styleCopy(key) {
  const lang = resolveLang();
  const row = STYLE_COPY[lang]?.[key] || STYLE_COPY.EN[key] || { label: key, phrases: [''] };
  const phrases = row.phrases || (row.phrase ? [row.phrase] : ['']);
  return {
    label: row.label || key,
    phrase: phrases[Math.floor(Math.random() * phrases.length)] || '',
  };
}

function idleLines() {
  const lang = resolveLang();
  return STR[lang]?.chatIdle || STR.EN.chatIdle;
}

function pickStr(key) {
  const lang = resolveLang();
  const val = STR[lang]?.[key] ?? STR.EN[key];
  if (Array.isArray(val)) return val[Math.floor(Math.random() * val.length)] || '';
  if (typeof val === 'string') return val;
  return key;
}

/** Soft client chatter wrapping a lesson question so it feels mid-appointment. */
function frameClientQuestion(card) {
  const lang = resolveLang();
  const table = STR[lang] || STR.EN;
  const body = String(card?.question || '').trim();
  const concept = String(card?.concept || '').trim();
  const mode = card?.mode || 'multiple';
  const bodyLower = body.toLowerCase();

  let pool;
  if (mode === 'chips' || mode === 'steps') {
    pool = table.quizLeadsOrder || table.quizLeads;
  } else if (mode === 'cloze') {
    pool = table.quizLeadsCloze || table.quizLeads;
  } else if (
    concept &&
    concept.length >= 2 &&
    concept.length <= 48 &&
    !bodyLower.includes(concept.toLowerCase()) &&
    (table.quizLeadsTopic || []).length
  ) {
    pool = table.quizLeadsTopic;
  } else {
    pool = table.quizLeads;
  }

  let lead = pickFrom(pool);
  if (lead.includes('{x}')) {
    if (concept) lead = lead.replaceAll('{x}', concept);
    else lead = pickFrom(table.quizLeads);
  }

  /* If the authored question already sounds chatty, keep the lead short. */
  const alreadyChatty =
    /^(ah|oh|hey|wait|espera|por cierto|una duda|ayúdame|ayudame|help me|by the way)\b/i.test(body);
  if (alreadyChatty) {
    return { lead: '', body, display: body, chat: lead || pickStr('chatQuiz') };
  }
  return {
    lead,
    body,
    display: lead ? `${lead}\n\n${body}` : body,
    chat: lead || pickStr('chatQuiz'),
  };
}

/** Same idea as Classroom: name what you're studying from quiz topics. */
function studyTopicLabel(quizzes, lesson) {
  const topics = [];
  const seen = new Set();
  for (const q of quizzes || []) {
    const topic = String(q?.concept || '').trim();
    if (!topic) continue;
    const key = topic.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    topics.push(topic);
    if (topics.length >= 3) break;
  }
  if (topics.length) return topics.join(', ');
  const lessonTitle = String(lesson?.title || '').trim();
  return lessonTitle || t('topicFallback');
}

function pickFrom(arr) {
  if (!Array.isArray(arr) || !arr.length) return '';
  return arr[Math.floor(Math.random() * arr.length)] || '';
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
    build(g) {
      fillAll(g, 0);
      for (let y = 2; y < 28; y++) for (let x = 24; x < 32; x++) g[y][x] = 1;
      for (let y = 28; y < 36; y++)
        for (let x = 22; x < 34; x++) if (inScalp(x, y) && !inFaceZone(x, y)) g[y][x] = 1;
      clearFaceWindow(g);
    },
  },
  buzz: {
    build(g) {
      fillAll(g, 0);
      for (let y = 14; y < 34; y++)
        for (let x = 12; x < 44; x++)
          if (inScalp(x, y) && y < 32 && Math.hypot(x - 28, y - 24) < 14) g[y][x] = 1;
      clearFaceWindow(g);
    },
  },
  bob: {
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
    build(g) {
      fillAll(g, 0);
    },
  },
  fringe: {
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
    build(g) {
      fillAll(g, 0);
      for (let y = 8; y < 28; y++)
        for (let x = 14; x < 42; x++)
          if (inScalp(x, y) && Math.hypot(x - 28, y - 20) < 12) g[y][x] = 1;
      clearFaceWindow(g);
    },
  },
  ponytail: {
    build(g) {
      fillAll(g, 0);
      for (let y = 6; y < 30; y++)
        for (let x = 14; x < 42; x++)
          if (Math.hypot(x - 28, y - 18) < 13) g[y][x] = 1;
      for (let y = 28; y < 58; y++)
        for (let x = 25; x < 31; x++) {
          if (Math.abs(x - 28) < 2.6 + (y - 28) * 0.02) g[y][x] = 1;
        }
      clearFaceWindow(g);
    },
  },
  spikes: {
    build(g) {
      fillAll(g, 0);
      for (let y = 16; y < 32; y++)
        for (let x = 14; x < 42; x++)
          if (inScalp(x, y) && Math.hypot(x - 28, y - 22) < 12) g[y][x] = 1;
      const tips = [18, 23, 28, 33, 38];
      for (const cx of tips) {
        for (let y = 2; y < 18; y++) {
          const w = 1 + (y < 8 ? 0 : 1);
          for (let x = cx - w; x <= cx + w; x++) g[y][x] = 1;
        }
      }
      clearFaceWindow(g);
    },
  },
  afro: {
    build(g) {
      fillAll(g, 0);
      for (let y = 2; y < 40; y++)
        for (let x = 6; x < 50; x++) {
          if (Math.hypot((x - 28) / 18, (y - 20) / 16) < 1) g[y][x] = 1;
        }
      clearFaceWindow(g);
    },
  },
  undercut: {
    build(g) {
      fillAll(g, 0);
      for (let y = 8; y < 24; y++)
        for (let x = 14; x < 42; x++) {
          if (Math.abs(x - 28) < 14 && y < 24) g[y][x] = 1;
        }
      for (let y = 20; y < 28; y++)
        for (let x = 16; x < 40; x++) if (inScalp(x, y) && !inFaceZone(x, y)) g[y][x] = 1;
      clearFaceWindow(g);
    },
  },
  sidePart: {
    build(g) {
      fillAll(g, 0);
      for (let y = 4; y < 44; y++)
        for (let x = 8; x < 36; x++) {
          const top = Math.hypot((x - 22) / 14, (y - 18) / 14) < 1;
          const fall = y > 24 && y < 46 && x < 30 && x > 10;
          if (top || fall) g[y][x] = 1;
        }
      clearFaceWindow(g);
    },
  },
  longLocks: {
    build(g) {
      fillAll(g, 0);
      for (let y = 4; y < 60; y++)
        for (let x = 8; x < 48; x++) {
          const top = Math.hypot((x - 28) / 17, (y - 18) / 14) < 1;
          const long = y >= 26 && Math.abs(x - 28) < 17 - (y - 26) * 0.05;
          const side = y >= 28 && y < 52 && (x <= 14 || x >= 42) && Math.abs(x - 28) < 20;
          if (top || long || side) g[y][x] = 1;
        }
      clearFaceWindow(g);
    },
  },
  topKnot: {
    build(g) {
      fillAll(g, 0);
      for (let y = 14; y < 30; y++)
        for (let x = 16; x < 40; x++)
          if (inScalp(x, y) && Math.hypot(x - 28, y - 22) < 11) g[y][x] = 1;
      for (let y = 2; y < 16; y++)
        for (let x = 22; x < 34; x++) {
          if (Math.hypot(x - 28, y - 9) < 6.5) g[y][x] = 1;
        }
      clearFaceWindow(g);
    },
  },
  curtain: {
    build(g) {
      fillAll(g, 0);
      for (let y = 6; y < 46; y++)
        for (let x = 8; x < 48; x++) {
          if (Math.abs(x - 28) < 3 && y < 28) continue;
          const left = Math.hypot((x - 18) / 10, (y - 22) / 16) < 1;
          const right = Math.hypot((x - 38) / 10, (y - 22) / 16) < 1;
          const crown = y < 20 && Math.hypot(x - 28, y - 14) < 12 && Math.abs(x - 28) > 2;
          if (left || right || crown) g[y][x] = 1;
        }
      clearFaceWindow(g);
    },
  },
  crew: {
    build(g) {
      fillAll(g, 0);
      for (let y = 10; y < 24; y++)
        for (let x = 16; x < 40; x++) {
          if (Math.abs(x - 28) < 11) g[y][x] = 1;
        }
      for (let y = 20; y < 30; y++)
        for (let x = 16; x < 40; x++) if (inScalp(x, y) && !inFaceZone(x, y)) g[y][x] = 1;
      clearFaceWindow(g);
    },
  },
  horns: {
    build(g) {
      fillAll(g, 0);
      for (let y = 14; y < 32; y++)
        for (let x = 14; x < 42; x++)
          if (inScalp(x, y) && Math.hypot(x - 28, y - 22) < 12) g[y][x] = 1;
      for (let y = 2; y < 16; y++) {
        for (let x = 12; x < 20; x++) {
          if (Math.hypot(x - 16, y - 8) < 4.5 - (16 - y) * 0.05) g[y][x] = 1;
        }
        for (let x = 36; x < 44; x++) {
          if (Math.hypot(x - 40, y - 8) < 4.5 - (16 - y) * 0.05) g[y][x] = 1;
        }
      }
      clearFaceWindow(g);
    },
  },
};

const STYLE_KEYS = Object.keys(STYLES);

function quizKey(q) {
  return `${q?.mode || 'multiple'}|${String(q?.question || '').trim()}|${String(q?.correct || '').trim()}`.toLowerCase();
}

function isOverviewQuestion(q) {
  const s = String(q?.question || '').toLowerCase();
  return /de qu[eé] trata|qu[eé] cubre|what is .+ about\b|what does .+ cover|what covers\b/.test(s);
}

function modesApi() {
  return window.arborito?.challenge?.modes || null;
}

function isOrderingCard(card) {
  const api = modesApi();
  if (api?.isOrdering) return !!api.isOrdering(card);
  return card?.mode === 'chips' || card?.mode === 'steps';
}

function distractorPoolFrom(challenges, modes) {
  return challenges
    .map((ch) => {
      const play = modes?.challengeForPlay?.(ch) || ch;
      return String(play?.correct_answer || play?.short_definition || '').trim();
    })
    .filter(Boolean);
}

function cardToQuiz(card, challenge, lessonId) {
  if (!card?.correct && !card?.sequence?.length) return null;
  const ordering = isOrderingCard(card);
  if (ordering) {
    if (!Array.isArray(card.sequence) || card.sequence.length < 2) return null;
    return {
      mode: card.mode,
      concept: card.concept,
      question: card.question,
      correct: card.correct,
      sequence: [...card.sequence],
      chips: [...(card.chips || card.sequence)],
      clozeDisplay: card.clozeDisplay,
      challenge,
      lessonId,
    };
  }
  const junk = new Set([': ', '\u2014', '-', '…', '...', 'N/A', 'Unknown']);
  const correct = String(card.correct || '').trim();
  if (!correct) return null;
  const cleanOpts = (card.options || [])
    .map(String)
    .map((s) => s.trim())
    .filter((s) => s && !junk.has(s));
  const options =
    cleanOpts.length >= 2
      ? [...new Set(cleanOpts)]
      : null;
  return {
    mode: card.mode || 'multiple',
    concept: card.concept,
    question: card.question,
    correct,
    options,
    clozeDisplay: card.clozeDisplay,
    challenge,
    lessonId,
  };
}

function buildQuizzes(lesson) {
  const api = window.arborito?.challenge;
  if (!api?.fromLesson) return mockQuizzes();
  const challenges = api.fromLesson(lesson) || [];
  const modes = api.modes;
  const lang = resolveLang();
  const pool = [];
  const allWrong = [];
  const distractors = distractorPoolFrom(challenges, modes);

  for (const c of challenges) {
    const playable = modes?.playable?.(c) || [];
    if (!playable.length) continue;
    for (const mode of playable) {
      const card = modes.buildCard(c, mode, {
        lessonTitle: lesson.title,
        lang,
        distractorPool: distractors,
      });
      if (!card) continue;
      const q = cardToQuiz(card, c, lesson.id);
      if (!q) continue;
      pool.push(q);
      if (q.options) {
        q.options.forEach((o) => {
          if (o !== q.correct) allWrong.push(o);
        });
      }
    }
  }

  const built = pool.map((q) => {
    if (isOrderingCard(q)) {
      return { ...q, chips: shuffle([...(q.chips || q.sequence)]) };
    }
    if (q.options?.length >= 2) return { ...q, options: shuffle(q.options) };
    const distractors2 = shuffle([...new Set(allWrong.filter((w) => w !== q.correct))]).slice(0, 3);
    while (distractors2.length < 3) distractors2.push(`?${distractors2.length + 1}`);
    return { ...q, options: shuffle([q.correct, ...distractors2.slice(0, 3)]) };
  });

  const meat = built.filter((q) => !isOverviewQuestion(q));
  const meta = built.filter((q) => isOverviewQuestion(q));
  return meat.length ? [...shuffle(meat), ...shuffle(meta)] : shuffle(built);
}

function mockQuizzes() {
  return [
    {
      mode: 'multiple',
      question: 'Capital of France?',
      correct: 'Paris',
      options: shuffle(['Paris', 'Lyon', 'Marseille', 'Nice']),
      lessonId: 'mock',
    },
    {
      mode: 'multiple',
      question: '2 + 2 = ?',
      correct: '4',
      options: shuffle(['3', '4', '5', '22']),
      lessonId: 'mock',
    },
    {
      mode: 'chips',
      question: 'Order the greeting',
      correct: 'good morning',
      sequence: ['good', 'morning'],
      chips: shuffle(['good', 'morning']),
      lessonId: 'mock',
    },
    {
      mode: 'steps',
      question: 'Order the steps',
      correct: 'Wash → Cut → Style',
      sequence: ['Wash', 'Cut', 'Style'],
      chips: shuffle(['Wash', 'Cut', 'Style']),
      lessonId: 'mock',
    },
    {
      mode: 'multiple',
      question: 'Daytime sky color',
      correct: 'Blue',
      options: shuffle(['Blue', 'Green', 'Red', 'Black']),
      lessonId: 'mock',
    },
    {
      mode: 'multiple',
      question: 'Opposite of cold',
      correct: 'Hot',
      options: shuffle(['Hot', 'Ice', 'Snow', 'Wind']),
      lessonId: 'mock',
    },
    {
      mode: 'multiple',
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
      btnFinish: document.getElementById('btnFinish'),
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
    this.quizLocked = false;
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
    document.documentElement.lang = resolveLang() === 'ES' ? 'es' : 'en';
    document.title = TITLE;
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
    if (this.els.btnFinish) this.els.btnFinish.textContent = t('finishCut');
    this.els.clientName.textContent = t('clientFallback');
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
    if (this.els.btnFinish) bindTap(this.els.btnFinish, () => this.handInCut());

    document.querySelectorAll('.tool[data-tool]').forEach((btn) => {
      bindTap(btn, () => {
        this.tool = btn.dataset.tool;
        document.querySelectorAll('.tool[data-tool]').forEach((b) => b.classList.toggle('active', b === btn));
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
    const studyTopic = studyTopicLabel(this.quizzes, this.lesson);
    const copy = styleCopy(this.styleKey);
    this.pendingOrderPhrase = copy.phrase;
    this.chatPhase = 'study';
    this.chatTimer = 7.2;
    this.setChat(t('chatStudy', { topic: studyTopic }));

    this.els.levelChip.textContent = t('levelChip', { n: this.level });
    this.els.scoreChip.textContent = `★ ${this.score}`;
    this.els.clientName.textContent = `${this.clientName} · ${copy.label}`;
    if (this.els.btnFinish) this.els.btnFinish.disabled = false;
    this.drawPreview();
    this.updateHud();
    this.lastTs = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame((ts) => this.tick(ts));
    this.draw();
  }

  pickIdle() {
    const lines = idleLines();
    return lines[Math.floor(Math.random() * lines.length)];
  }

  setChat(text) {
    const el = this.els.chatText;
    if (!el) return;
    const next = String(text || '');
    if (el.textContent === next && !el.classList.contains('chat-out')) return;
    clearTimeout(this._chatAnim);
    el.classList.remove('chat-in');
    el.classList.add('chat-out');
    this._chatAnim = setTimeout(() => {
      el.textContent = next;
      el.classList.remove('chat-out');
      el.classList.add('chat-in');
    }, 160);
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
        if (this.chatPhase === 'study') {
          this.setChat(this.pendingOrderPhrase || styleCopy(this.styleKey).phrase);
          this.chatPhase = 'order';
          this.chatTimer = 6.8;
        } else {
          this.setChat(this.pickIdle());
          this.chatPhase = 'idle';
          this.chatTimer = 6.8 + Math.random() * 2.4;
        }
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

    /* No auto-win on match % — only hand-in button or timer expiry. */
    if (!this.quizOpen && this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.deliverCut({ timedOut: true });
      return;
    }

    this.raf = requestAnimationFrame((t2) => this.tick(t2));
  }

  openQuiz() {
    if (!this.quizzes.length) return;
    this.quizOpen = true;
    this.quizLocked = false;
    this.drawing = false;

    let q = this.quizzes[this.quizIdx % this.quizzes.length];
    let tries = 0;
    while (this.usedQuizKeys.has(quizKey(q)) && tries < this.quizzes.length) {
      this.quizIdx++;
      q = this.quizzes[this.quizIdx % this.quizzes.length];
      tries++;
    }
    this.currentQuiz = q;

    const frame = frameClientQuestion(q);
    this.setChat(frame.chat);

    const modes = modesApi();
    const lang = resolveLang();
    const ordering = isOrderingCard(q);
    this.els.quizBadge.textContent = t('quizBadge');

    /* Choice: lead + question up top. Ordering: lead up top, prompt in seq-hint. */
    this.els.quizQ.hidden = false;
    if (ordering) {
      this.els.quizQ.textContent = frame.lead || pickStr('chatQuiz');
    } else {
      this.els.quizQ.textContent = frame.display;
    }

    this.els.quizOpts.innerHTML = '';
    this.els.quizOpts.classList.toggle('is-ordering', ordering);

    if (modes?.renderAnswers) {
      /* SDK injects the raw question into seq-hint; keep body only for ordering. */
      const renderCard = ordering ? { ...q, question: frame.body || q.question } : { ...q, question: '' };
      this.els.quizOpts.innerHTML = modes.renderAnswers(
        ordering ? renderCard : q,
        { showOpts: true, lang }
      );
      if (ordering) {
        const hint = this.els.quizOpts.querySelector('.seq-hint');
        if (hint) hint.textContent = frame.body || q.question || '';
      }
      this.bindQuizInteraction(q);
    } else if (ordering) {
      this.renderOrderingFallback({ ...q, question: frame.body || q.question });
    } else {
      this.renderChoiceFallback(q);
    }

    this.els.quizOverlay.classList.remove('hidden');
    this.draw();
  }

  renderChoiceFallback(q) {
    const opts = shuffle([...(q.options || [q.correct])]).slice(0, 4);
    if (!opts.includes(q.correct)) opts[0] = q.correct;
    for (const opt of shuffle(opts)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'opt-btn';
      btn.dataset.value = opt;
      btn.textContent = opt;
      bindTap(btn, () => this.onChoicePick(opt, btn));
      this.els.quizOpts.appendChild(btn);
    }
  }

  renderOrderingFallback(q) {
    const lang = resolveLang();
    const words = shuffle([...(q.chips || q.sequence || [])]);
    const targetPh = lang === 'ES' ? 'Toca las palabras en orden…' : 'Tap words below in order…';
    const confirmLabel = lang === 'ES' ? 'Confirmar' : 'Confirm';
    this.els.quizOpts.innerHTML = `
      <div class="seq-wrap" data-mode="${q.mode || 'chips'}">
        <p class="seq-hint"></p>
        <div class="seq-target" data-seq-target><span class="seq-target-ph">${targetPh}</span></div>
        <div class="seq-pool" data-seq-pool>
          ${words
            .map(
              (chip, i) =>
                `<button type="button" class="seq-chip" data-chip="${String(chip).replace(/"/g, '&quot;')}" data-chip-idx="${i}">${chip}</button>`
            )
            .join('')}
        </div>
        <button type="button" class="seq-submit">${confirmLabel}</button>
      </div>`;
    const hint = this.els.quizOpts.querySelector('.seq-hint');
    if (hint) hint.textContent = q.question || '';
    this.bindQuizInteraction(q);
  }

  bindQuizInteraction(card) {
    const root = this.els.quizOpts;
    if (isOrderingCard(card)) {
      const pool = root.querySelector('[data-seq-pool]');
      const target = root.querySelector('[data-seq-target]');
      const submitBtn = root.querySelector('.seq-submit');
      const expectedLen = Array.isArray(card.sequence) ? card.sequence.length : 0;

      const refreshPh = () => {
        const ph = target?.querySelector('.seq-target-ph');
        if (!ph || !target) return;
        ph.style.display = target.querySelector('.seq-chip') ? 'none' : '';
      };

      const submitNow = () => {
        if (this.quizLocked) return;
        const picked = [...(target?.querySelectorAll('.seq-chip') || [])].map(
          (c) => c.dataset.chip || ''
        );
        const api = modesApi();
        const ok = api?.checkOrder
          ? api.checkOrder(card, picked)
          : picked.length === card.sequence.length &&
            picked.every((w, i) => w === card.sequence[i]);
        this.finishQuiz(ok);
      };

      root.querySelectorAll('.seq-chip').forEach((chip) => {
        bindTap(chip, () => {
          if (this.quizLocked || !pool || !target) return;
          if (chip.parentElement === target) {
            pool.appendChild(chip);
          } else {
            target.appendChild(chip);
            if (expectedLen > 0 && target.querySelectorAll('.seq-chip').length >= expectedLen) {
              refreshPh();
              submitNow();
              return;
            }
          }
          refreshPh();
        });
      });
      if (submitBtn) bindTap(submitBtn, submitNow);
      return;
    }

    root.querySelectorAll('.opt-btn').forEach((btn) => {
      bindTap(btn, () => this.onChoicePick(btn.dataset.value || btn.textContent, btn));
    });
  }

  onChoicePick(opt, btn) {
    if (this.quizLocked || !this.quizOpen || !this.currentQuiz) return;
    const q = this.currentQuiz;
    const ok = String(opt).trim() === String(q.correct).trim();
    [...this.els.quizOpts.querySelectorAll('.opt-btn')].forEach((b) => {
      b.disabled = true;
      if (String(b.dataset.value || b.textContent).trim() === String(q.correct).trim()) {
        b.classList.add('correct', 'ok');
      }
    });
    if (!ok && btn) btn.classList.add('wrong', 'bad');
    this.finishQuiz(ok);
  }

  finishQuiz(ok) {
    if (!this.quizOpen || !this.currentQuiz || this.quizLocked) return;
    this.quizLocked = true;
    const q = this.currentQuiz;
    const cfg = this.levelCfg();

    if (isOrderingCard(q)) {
      this.els.quizOpts.querySelectorAll('.seq-chip, .seq-submit').forEach((b) => {
        b.disabled = true;
      });
      const wrap = this.els.quizOpts.querySelector('.seq-wrap');
      if (wrap) wrap.classList.add(ok ? 'is-correct' : 'is-wrong');
    }

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
      this.setChat(pickStr('chatOk') + ' ' + t('timeBonus', { n: cfg.bonus }));
    } else {
      this.timeLeft = Math.max(1, this.timeLeft - cfg.penalty);
      this.regrowHair(0.06);
      this.setChat(pickStr('chatBad') + ' ' + t('timePenalty', { n: cfg.penalty }));
    }
    this.chatPhase = 'idle';
    this.chatTimer = 6.8;
    this.els.scoreChip.textContent = `★ ${this.score}`;

    setTimeout(() => {
      this.els.quizOverlay.classList.add('hidden');
      this.quizOpen = false;
      this.quizLocked = false;
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

  handInCut() {
    if (!this.playing || this.quizOpen) return;
    this.deliverCut({ timedOut: false });
  }

  /**
   * Deliver the cut: hand-in button or timer (never auto on match %).
   * Timer with a bad cut ends the shift; early hand-in below the mark
   * still clears the client with reduced points.
   */
  deliverCut({ timedOut = false } = {}) {
    if (!this.playing) return;
    const cut = this.matchPct();
    const passed = cut >= MATCH_TARGET;

    if (timedOut && !passed) {
      this.endSession(false);
      return;
    }

    this.winLevel({
      handedIn: !timedOut,
      timedOut,
      cut,
    });
  }

  winLevel({ handedIn = false, timedOut = false, cut: cutArg } = {}) {
    this.playing = false;
    cancelAnimationFrame(this.raf);
    if (this.els.btnFinish) this.els.btnFinish.disabled = true;
    const cut = cutArg != null ? cutArg : this.matchPct();
    const early = handedIn && cut < MATCH_TARGET;
    const timeBonus = Math.round(Math.max(0, this.timeLeft));
    let pts = 40 + timeBonus * 2 + this.level * 10 + Math.max(0, cut - MATCH_TARGET);
    if (early) {
      pts = Math.max(8, Math.round(pts * Math.max(0.22, cut / MATCH_TARGET) * 0.75));
    } else if (timedOut) {
      /* Timer forced the hand-in — no leftover-time bonus. */
      pts = 40 + this.level * 10 + Math.max(0, cut - MATCH_TARGET);
    }
    this.score += pts;
    this.els.scoreChip.textContent = `★ ${this.score}`;

    if (this.lesson?.id && this.lesson.id !== 'mock' && window.arborito?.memory?.report) {
      try {
        window.arborito.memory.report(this.lesson.id, early ? 2 : 3);
      } catch (_) {}
    }
    if (window.arborito?.xp) {
      try {
        window.arborito.xp(pts);
      } catch (_) {}
    }

    this.els.levelPct.textContent = `${cut}%`;
    this.els.levelPct.className = 'pct' + (early && cut < 50 ? ' meh' : '');
    this.els.levelTitle.textContent = early ? t('handInTitle') : t('levelWinTitle');
    this.els.levelMsg.textContent = early
      ? t('handInMsg', { cut, pts })
      : t('levelWinMsg', {
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
