export type RasterIconOptions = {
    iconClass: string;
    color: string;
    sizePx?: number; // logical CSS pixels
};

async function resolveFAGlyph(iconClass: string): Promise<{
    glyph: string;
    fontFamily: string | null;
    fontWeight: string | null;
}> {
    const probe = document.createElement('i');
    probe.className = iconClass;
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.fontSize = '24px';
    document.body.appendChild(probe);

    try {
        // Ensure webfonts are ready before measuring
        if ((document as any).fonts && typeof (document as any).fonts.ready?.then === 'function') {
            await (document as any).fonts.ready;
        }
        const pseudo = getComputedStyle(probe, '::before');
        let content = pseudo.content || '';
        const family = pseudo.fontFamily || null;
        const weight = pseudo.fontWeight || null;
        // content is quoted string, often like "\f0e7"
        if (content.startsWith('"') || content.startsWith("'")) {
            content = content.slice(1, -1);
        }
        // Unescape \\fXXX sequences
        content = content.replace(/\\([0-9a-fA-F]{1,6})/g, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)));
        const glyph = content && content !== 'none' ? content : '';
        return {glyph, fontFamily: family, fontWeight: weight};
    } finally {
        probe.remove();
    }
}

const iconCache = new Map<string, google.maps.Icon>();

export function clearRasterIconCache() {
    iconCache.clear();
}

export function makeCircleSvgDataUrl(color: string, sizePx: number): string {
    const dpr = Math.ceil(window.devicePixelRatio || 1);
    const w = sizePx * dpr;
    const h = sizePx * dpr;
    const r = Math.min(w, h) * 0.46;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
        `<circle cx="${w / 2}" cy="${h / 2}" r="${r}" fill="${color}"/>` +
        `</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export async function getRasterIcon(options: RasterIconOptions): Promise<google.maps.Icon> {
    const sizePx = options.sizePx ?? 24;
    const dpr = Math.ceil(window.devicePixelRatio || 1);
    const key = `${options.iconClass}|${options.color}|${sizePx}|${dpr}`;
    const cached = iconCache.get(key);
    if (cached) return cached;

    const w = sizePx * dpr;
    const h = sizePx * dpr;

    // Try to obtain an SVG version of the FA icon via the kit's SVG replacement
    const svgIconMarkup = await getFontAwesomeSvgMarkup(options.iconClass);
    let pngUrl: string | null = null;

    if (svgIconMarkup) {
        // Compose wrapper SVG with background circle and centered FA SVG
        const iconScale = 0.58; // tuned to match original DOM size
        const iconWH = Math.round(w * iconScale);
        const iconXY = Math.round((w - iconWH) / 2);
        const composed = `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
            `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.46}" fill="${options.color}"/>` +
            `<g transform="translate(${iconXY},${iconXY})">` +
            // enforce white color on paths via fill=currentColor and color=white
            `<svg x="0" y="0" width="${iconWH}" height="${iconWH}" color="#ffffff">${svgIconMarkup}</svg>` +
            `</g>` +
            `</svg>`;
        const blob = new Blob([composed], {type: 'image/svg+xml'});
        const objUrl = URL.createObjectURL(blob);
        try {
            const bitmap = await createImageBitmap(await (await fetch(objUrl)).blob());
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas 2D context unavailable');
            ctx.drawImage(bitmap, 0, 0);
            const outBlob: Blob = await new Promise(resolve =>
                canvas.toBlob(b => resolve(b as Blob), 'image/png'),
            );
            pngUrl = URL.createObjectURL(outBlob);
        } finally {
            URL.revokeObjectURL(objUrl);
        }
    }

    if (!pngUrl) {
        // Fallback: use font glyph rendering
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');
        ctx.fillStyle = options.color;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.46, 0, Math.PI * 2);
        ctx.fill();

        const {glyph, fontFamily, fontWeight} = await resolveFAGlyph(options.iconClass);
        if (glyph) {
            ctx.fillStyle = '#ffffff';
            const fontPx = Math.round(sizePx * 0.58 * dpr);
            const weight = fontWeight || '900';
            const family = fontFamily || '"Font Awesome 6 Free", "Font Awesome 6 Brands"';
            ctx.font = `${weight} ${fontPx}px ${family}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(glyph, w / 2, h / 2);
        }
        const outBlob: Blob = await new Promise(resolve =>
            canvas.toBlob(b => resolve(b as Blob), 'image/png'),
        );
        pngUrl = URL.createObjectURL(outBlob);
    }

    const icon: google.maps.Icon = {
        url: pngUrl,
        size: new google.maps.Size(w, h),
        scaledSize: new google.maps.Size(sizePx, sizePx),
        // precise bottom-center anchoring to match hit area
        anchor: new google.maps.Point(Math.round(sizePx / 2), sizePx),
    };
    iconCache.set(key, icon);
    return icon;
}

async function getFontAwesomeSvgMarkup(iconClass: string): Promise<string | null> {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.visibility = 'hidden';
    container.style.pointerEvents = 'none';
    container.style.width = '0';
    container.style.height = '0';
    const i = document.createElement('i');
    i.className = iconClass;
    container.appendChild(i);
    document.body.appendChild(container);

    try {
        const deadline = Date.now() + 500; // up to 500ms to allow FA kit to convert
        let svg: SVGSVGElement | null = null;
        while (Date.now() < deadline) {
            await new Promise(r => setTimeout(r, 16));
            svg = container.querySelector('svg');
            if (svg) break;
        }
        if (!svg) return null;
        // Clone and scrub inline colors so we can enforce white via parent color
        const clone = svg.cloneNode(true) as SVGSVGElement;
        clone.removeAttribute('width');
        clone.removeAttribute('height');
        clone.setAttribute('fill', 'currentColor');
        // Remove any fill attributes on child paths to allow color inheritance
        clone.querySelectorAll('[fill]').forEach(el => el.removeAttribute('fill'));
        return clone.innerHTML || clone.outerHTML;
    } finally {
        container.remove();
    }
}


