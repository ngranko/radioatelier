const MERCATOR_WORLD_PX = 256;
const MIN_ZOOM_FLOOR = 2;
const MIN_ZOOM_CEIL = 4;

export function computeMinZoomForContainer(container: HTMLElement): number {
    const span = Math.max(container.clientWidth, container.clientHeight);
    if (span < 1) {
        return MIN_ZOOM_FLOOR;
    }
    const raw = Math.ceil(Math.log2(span / MERCATOR_WORLD_PX));
    return Math.max(MIN_ZOOM_FLOOR, Math.min(MIN_ZOOM_CEIL, raw));
}
