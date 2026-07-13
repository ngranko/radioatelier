import {heightForPosition} from '$lib/components/objectDetails/sheetSnap';
import type {ObjectDetailsOverlayPosition} from '$lib/state/objectDetailsOverlay.svelte';

export const DETAILS_OVERLAY_WIDTH = 424;
const MIN_UNCOVERED_MAP_WIDTH = 400;

export interface DetailsFocusOffsetInput {
    lat: number;
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
        return {latOffset: 0, lngOffset: sidePanelLngOffset(input.zoom)};
    }

    if (input.overlayPosition !== 'peek') {
        return {latOffset: 0, lngOffset: 0};
    }

    const overlayHeight = heightForPosition('peek', input.viewportHeight);
    return {
        latOffset: latOffsetForPixels(input.lat, input.zoom, overlayHeight),
        lngOffset: 0,
    };
}

export function usesSidePanelOffset(viewportWidth: number) {
    return viewportWidth - DETAILS_OVERLAY_WIDTH >= MIN_UNCOVERED_MAP_WIDTH;
}

function sidePanelLngOffset(zoom: number) {
    return -(DETAILS_OVERLAY_WIDTH / 2) * degreesPerPixel(zoom);
}

function latOffsetForPixels(lat: number, zoom: number, pixels: number) {
    // Shift the center south so the marker sits above the geometric center by
    // `pixels`, clearing the bottom sheet. Cosine corrects mercator stretch.
    return -pixels * degreesPerPixel(zoom) * Math.cos((lat * Math.PI) / 180);
}

function degreesPerPixel(zoom: number) {
    return 360 / (256 * 2 ** zoom);
}
