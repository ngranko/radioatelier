import {heightForPosition} from '$lib/components/objectDetails/sheetSnap';
import type {ObjectDetailsOverlayPosition} from '$lib/state/objectDetailsOverlay.svelte';

export const DETAILS_OVERLAY_WIDTH = 424;
const MIN_UNCOVERED_MAP_WIDTH = 400;

export interface DetailsFocusOffsetInput {
    zoom: number;
    viewportWidth: number;
    viewportHeight: number;
    overlayPosition: ObjectDetailsOverlayPosition;
}

export interface DetailsFocusOffset {
    latOffset: number;
    lngOffset: number;
}

export function detailsFocusOffsets(input: DetailsFocusOffsetInput): DetailsFocusOffset {
    if (usesSidePanelOffset(input.viewportWidth)) {
        return {
            latOffset: 0,
            lngOffset: degreesOffsetForPixels(input.zoom, DETAILS_OVERLAY_WIDTH / 2),
        };
    }

    if (input.overlayPosition !== 'peek') {
        return {latOffset: 0, lngOffset: 0};
    }

    const overlayHeight = heightForPosition('peek', input.viewportHeight);
    return {
        latOffset: degreesOffsetForPixels(input.zoom, overlayHeight),
        lngOffset: 0,
    };
}

export function usesSidePanelOffset(viewportWidth: number) {
    return viewportWidth - DETAILS_OVERLAY_WIDTH >= MIN_UNCOVERED_MAP_WIDTH;
}

function degreesOffsetForPixels(zoom: number, pixels: number) {
    return -pixels * (360 / (256 * 2 ** zoom));
}
