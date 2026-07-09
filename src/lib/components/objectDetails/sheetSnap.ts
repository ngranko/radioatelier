import type {ObjectDetailsOverlayPosition} from '$lib/state/objectDetailsOverlay.svelte';

export interface DragSample {
    height: number;
    time: number;
}

export const MINIMIZED_HEIGHT = 56;
export const SHEET_MARGIN = 16;

const PEEK_HEIGHT_RATIO = 0.42;
const INERTIA_PROJECTION_MS = 220;
const MAX_INERTIA_DELTA = 220;

export function heightForPosition(position: ObjectDetailsOverlayPosition, viewportHeight: number) {
    switch (position) {
        case 'minimized':
            return MINIMIZED_HEIGHT;
        case 'peek':
            return Math.round(viewportHeight * PEEK_HEIGHT_RATIO);
        default:
            return viewportHeight - SHEET_MARGIN;
    }
}

export function clampSheetHeight(height: number, viewportHeight: number) {
    return Math.min(Math.max(height, MINIMIZED_HEIGHT), viewportHeight - SHEET_MARGIN);
}

export function getSettledPosition(
    height: number,
    viewportHeight: number,
    previousSample: DragSample | null,
    currentSample: DragSample | null,
) {
    const projectedHeight = projectReleaseHeight(height, previousSample, currentSample);

    return getNearestPosition(projectedHeight, viewportHeight);
}

function getNearestPosition(height: number, viewportHeight: number): ObjectDetailsOverlayPosition {
    const positions: ObjectDetailsOverlayPosition[] = ['minimized', 'peek', 'full'];

    return positions.reduce((best, position) =>
        Math.abs(heightForPosition(position, viewportHeight) - height) <
        Math.abs(heightForPosition(best, viewportHeight) - height)
            ? position
            : best,
    );
}

function projectReleaseHeight(
    height: number,
    previousSample: DragSample | null,
    currentSample: DragSample | null,
) {
    if (!previousSample || !currentSample || currentSample.time <= previousSample.time) {
        return height;
    }

    const velocity =
        (currentSample.height - previousSample.height) / (currentSample.time - previousSample.time);
    const projectedDelta = clamp(
        velocity * INERTIA_PROJECTION_MS,
        -MAX_INERTIA_DELTA,
        MAX_INERTIA_DELTA,
    );

    return height + projectedDelta;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}
