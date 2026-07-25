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
        toastSpaceKeys:
            'Propulsa con <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> o flechas. Cerca de un planeta, <kbd>Espacio</kbd> para <strong style="color:#22c55e">ATERRIZAR</strong>.',
        toastPlanet:
            'Muévete y salta. Acércate a los marcianos, verás <strong style="color:#22c55e">HABLAR</strong>. E.D.E.N. te irá contando el resto.',
        toastPlanetKeys:
            'Muévete con <kbd>A</kbd><kbd>D</kbd> o flechas, salta con <kbd>Espacio</kbd>, dispara con <kbd>R</kbd>. Cerca de un marciano o la nave, pulsa <kbd>E</kbd>.',
        toastTitleSpace: 'EN ÓRBITA',
        toastTitlePlanet: 'EN SUPERFICIE',
        toastHint: 'Toca para continuar',
        toastHintKeys: 'Pulsa una tecla para continuar',
        dialogueContinue: 'TOCA PARA CONTINUAR ▶',
        dialogueContinueKeys: 'PULSA ESPACIO O E ▶',
        shootHintKeys: 'Dispara con <kbd>R</kbd>',
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
        toastSpaceKeys:
            'Thrust with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows. Near a planet, press <kbd>Space</kbd> to <strong style="color:#22c55e">LAND</strong>.',
        toastPlanet:
            'Move and jump. Near Martians you will see <strong style="color:#22c55e">TALK</strong>. E.D.E.N. guides the rest.',
        toastPlanetKeys:
            'Move with <kbd>A</kbd><kbd>D</kbd> or arrows, jump with <kbd>Space</kbd>, shoot with <kbd>R</kbd>. Near a Martian or the ship, press <kbd>E</kbd>.',
        toastTitleSpace: 'IN ORBIT',
        toastTitlePlanet: 'ON SURFACE',
        toastHint: 'Tap to continue',
        toastHintKeys: 'Press any key to continue',
        dialogueContinue: 'TAP TO CONTINUE ▶',
        dialogueContinueKeys: 'PRESS SPACE OR E ▶',
        shootHintKeys: 'Shoot with <kbd>R</kbd>',
        landPrompt: '[SPACE] LAND',
    },
};

export function uiCopy(key, lang = cartridgeLang()) {
    const table = UI_COPY[lang] || UI_COPY.EN;
    return table[key] || UI_COPY.EN[key] || '';
}

/** True when touch pads are hidden — show keyboard key hints instead. */
export function usesKeyboardHints() {
    try {
        return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch {
        return true;
    }
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
