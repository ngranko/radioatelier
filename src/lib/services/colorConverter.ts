/** ~40% opacity for marker halo; works for hex and oklch (unlike appending `40` to hex only). */
export function markerHaloColor(baseColor: string): string {
    return `color-mix(in oklch, ${baseColor} 40%, transparent)`;
}

const HEX_COLOR = /^#?[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/;
const domResolvedRgb = new Map<string, {r: number; g: number; b: number}>();

/** For deck.gl and other APIs that need byte RGB. Hex is parsed locally; other CSS colors use the browser (OKLCH, lab, named, etc.). */
export function cssColorToRgb(color: string): {r: number; g: number; b: number} {
    const trimmed = color.trim();
    if (HEX_COLOR.test(trimmed)) {
        return hexToRgb(trimmed);
    }
    if (typeof document === 'undefined') {
        throw new Error(`cssColorToRgb: non-hex color requires a browser: ${trimmed}`);
    }
    const cached = domResolvedRgb.get(trimmed);
    if (cached) {
        return cached;
    }
    const resolved = resolveCssColorToRgbDom(trimmed);
    domResolvedRgb.set(trimmed, resolved);
    return resolved;
}

export function hexToRgb(hex: string): {r: number; g: number; b: number} {
    if (!HEX_COLOR.test(hex)) {
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

/** Resolves any CSS color the engine understands to sRGB bytes. `getComputedStyle().color` can serialize as oklch()/color() etc., so we rasterize instead of parsing strings. */
function resolveCssColorToRgbDom(cssColor: string): {r: number; g: number; b: number} {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', {colorSpace: 'srgb', willReadFrequently: true});
    if (!ctx) {
        throw new Error('2D canvas unavailable for cssColorToRgb');
    }
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const {data} = ctx.getImageData(0, 0, 1, 1);
    return {r: data[0]!, g: data[1]!, b: data[2]!};
}
