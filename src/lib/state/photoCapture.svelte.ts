import type {Location} from '$lib/interfaces/location';
import {listUnsentCaptures, type UnsentCapture} from '$lib/services/photoCapture/unsentCaptures';

export const photoCaptureState = $state({
    isSending: false,
    isPinRequested: false,
    unsent: [] as UnsentCapture[],
});

export async function refreshUnsentCaptures() {
    try {
        photoCaptureState.unsent = await listUnsentCaptures();
    } catch (error) {
        console.error('Failed to read unsent photo captures:', error);
    }
}

let resolvePin: ((location: Location | null) => void) | null = null;

/** Waits for the next map tap, or null when the owner gives up on placing the photo. */
export function requestCapturePin(): Promise<Location | null> {
    resolvePin?.(null);
    photoCaptureState.isPinRequested = true;
    return new Promise(resolve => {
        resolvePin = resolve;
    });
}

export function resolveCapturePin(location: Location | null) {
    photoCaptureState.isPinRequested = false;
    resolvePin?.(location);
    resolvePin = null;
}
