import {markerHaloColor} from '$lib/services/colorConverter';

export const MARKER_VISITED_COLOR = '#39ff14';

const DROP_SHADOW = '0 2px 4px rgba(0,0,0,0.2)';

export function markerBoxShadow(
    color: string,
    options: {inverted?: boolean; visited?: boolean} = {},
): string {
    if (options.inverted) {
        return `0 0 0 3px ${color}, 0 0 0 5px rgba(255,255,255,0.25), ${DROP_SHADOW}`;
    }

    const halo = markerHaloColor(color);
    if (options.visited) {
        return `0 0 0 1px rgba(0,0,0,0.3), 0 0 0 3px ${MARKER_VISITED_COLOR}, 0 0 0 5px ${halo}, ${DROP_SHADOW}`;
    }

    return `0 0 0 3px white, 0 0 0 5px ${halo}, ${DROP_SHADOW}`;
}
