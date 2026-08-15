export const DEBUG_MARKER_MIN = 1;
export const DEBUG_MARKER_MAX = 5000;
export const DEBUG_MARKER_DEFAULT = 200;

export function clampMarkerCount(value: number): number {
    if (!Number.isFinite(value)) {
        return DEBUG_MARKER_DEFAULT;
    }
    return Math.min(DEBUG_MARKER_MAX, Math.max(DEBUG_MARKER_MIN, Math.round(value)));
}
