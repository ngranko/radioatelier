export function getContrastingColor(baseColor: string): string {
    const {h, s, l} = hexToHsl(baseColor);

    // Default green color (emerald-500)
    const defaultGreen = '#10b981';
    const defaultGreenHsl = hexToHsl(defaultGreen);

    // Calculate color similarity (hue difference)
    const hueDifference = Math.abs(h - defaultGreenHsl.h);
    const normalizedHueDifference = Math.min(hueDifference, 360 - hueDifference) / 180;

    // If the base color is too similar to green (hue difference < 60 degrees), use a different color
    if (normalizedHueDifference < 0.33) {
        // Use a contrasting color that's not green
        if (s > 0.6) {
            // High saturation: use complementary hue in the safe lightness range
            const complementaryH = (h + 180) % 360;
            const safeLightness = l > 0.5 ? 0.25 : 0.75;
            return hslToHex(complementaryH, Math.min(s, 0.9), safeLightness);
        } else {
            // Low saturation: use high contrast but stay in visible zone
            if (l > 0.5) {
                return '#2563eb'; // blue-600
            } else {
                return '#f59e0b'; // amber-500
            }
        }
    }

    return defaultGreen;
}

export function hexToRgb(hex: string): {r: number; g: number; b: number} {
    if (!/^#?[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(hex)) {
        throw new Error(`Invalid hex color: ${hex}`);
    }

    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h
            .split('')
            .map(c => c + c)
            .join('');
    }
    const num = Number.parseInt(h, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

function hexToHsl(hex: string): {h: number; s: number; l: number} {
    const {r, g, b} = hexToRgb(hex);
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const diff = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (diff !== 0) {
        s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

        switch (max) {
            case rNorm:
                h = ((gNorm - bNorm) / diff + (gNorm < bNorm ? 6 : 0)) / 6;
                break;
            case gNorm:
                h = ((bNorm - rNorm) / diff + 2) / 6;
                break;
            case bNorm:
                h = ((rNorm - gNorm) / diff + 4) / 6;
                break;
        }
    }

    return {h: h * 360, s, l};
}

function hslToHex(h: number, s: number, l: number): string {
    const hNorm = h / 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((hNorm * 6) % 2) - 1));
    const m = l - c / 2;

    let r = 0,
        g = 0,
        b = 0;

    if (0 <= hNorm && hNorm < 1 / 6) {
        r = c;
        g = x;
        b = 0;
    } else if (1 / 6 <= hNorm && hNorm < 2 / 6) {
        r = x;
        g = c;
        b = 0;
    } else if (2 / 6 <= hNorm && hNorm < 3 / 6) {
        r = 0;
        g = c;
        b = x;
    } else if (3 / 6 <= hNorm && hNorm < 4 / 6) {
        r = 0;
        g = x;
        b = c;
    } else if (4 / 6 <= hNorm && hNorm < 5 / 6) {
        r = x;
        g = 0;
        b = c;
    } else if (5 / 6 <= hNorm && hNorm < 1) {
        r = c;
        g = 0;
        b = x;
    }

    const rFinal = Math.round((r + m) * 255);
    const gFinal = Math.round((g + m) * 255);
    const bFinal = Math.round((b + m) * 255);

    return `#${rFinal.toString(16).padStart(2, '0')}${gFinal.toString(16).padStart(2, '0')}${bFinal.toString(16).padStart(2, '0')}`;
}
