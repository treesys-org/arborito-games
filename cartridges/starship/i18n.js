/** Cartridge UI language from Arborito host (`arborito.user.lang`). */
export function cartridgeLang() {
    const u = window.arborito && window.arborito.user && window.arborito.user.lang;
    return String(u || 'EN').toUpperCase() === 'ES' ? 'ES' : 'EN';
}

const UI_COPY = {
    ES: {
        btnTalk: 'HABLAR',
        btnGo: 'IR',
        btnInfo: 'INFO',
        btnLand: 'ATERRIZAR',
        btnWarp: 'SALTO',
        toastSpace:
            'Propulsa hacia un planeta del radar. Cuando estés cerca, aparecerá <strong style="color:#22c55e">ATERRIZAR</strong>.',
        toastPlanet:
            'Muévete y salta. Acércate a los marcianos, verás <strong style="color:#22c55e">HABLAR</strong>. E.D.E.N. te irá contando el resto.',
        toastTitleSpace: 'EN ÓRBITA',
        toastTitlePlanet: 'EN SUPERFICIE',
        toastHint: 'Toca para continuar',
        landPrompt: '[ESPACIO] ATERRIZAR',
    },
    EN: {
        btnTalk: 'TALK',
        btnGo: 'GO',
        btnInfo: 'INFO',
        btnLand: 'LAND',
        btnWarp: 'WARP',
        toastSpace:
            'Thrust toward a radar planet. When close, <strong style="color:#22c55e">LAND</strong> appears.',
        toastPlanet:
            'Move and jump. Near Martians you will see <strong style="color:#22c55e">TALK</strong>. E.D.E.N. guides the rest.',
        toastTitleSpace: 'IN ORBIT',
        toastTitlePlanet: 'ON SURFACE',
        toastHint: 'Tap to continue',
        landPrompt: '[SPACE] LAND',
    },
};

export function uiCopy(key, lang = cartridgeLang()) {
    const table = UI_COPY[lang] || UI_COPY.EN;
    return table[key] || UI_COPY.EN[key] || '';
}

/** Coarse pointer / small screens → lighter draw + snappier feel. */
export function isLowQualityDevice() {
    try {
        if (window.matchMedia('(pointer: coarse)').matches) return true;
        if (Math.min(window.innerWidth, window.innerHeight) < 700) return true;
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;
    } catch {
        /* ignore */
    }
    return false;
}
