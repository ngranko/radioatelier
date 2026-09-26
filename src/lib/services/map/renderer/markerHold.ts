/**
 * The press that starts a reposition has to outlast a tap and lose to a pan or a pinch. Maps reports
 * its own dragstart only once the map actually moves, and never reports a two-finger zoom, so the
 * raw pointer stream is watched here as well: everything that hints at navigating the map instead of
 * grabbing a marker drops the hold.
 */
import {tickHaptic} from '$lib/utils/haptics';

export const HOLD_MS = 350;

// A finger never sits perfectly still, but a pan shows up as a slide well before this.
const DRIFT_TOLERANCE_PX = 8;

let cancelArmedHold: (() => void) | undefined;

/** Lets the map cancel a hold from its own gestures without knowing which renderer armed it. */
export function cancelActiveMarkerHold(): void {
    cancelArmedHold?.();
}

export class MarkerHold {
    private timeout?: number;
    private pointerId?: number;
    private origin?: {x: number; y: number};
    private onHold?: () => void;

    public arm(event: PointerEvent, onHold: () => void): void {
        cancelActiveMarkerHold();
        this.pointerId = event.pointerId;
        this.origin = {x: event.clientX, y: event.clientY};
        this.onHold = onHold;
        this.timeout = window.setTimeout(this.fire, HOLD_MS);
        cancelArmedHold = this.cancel;
        this.watchInterruptions();
    }

    public cancel = (): void => {
        if (this.timeout === undefined) {
            return;
        }
        clearTimeout(this.timeout);
        this.disarm();
    };

    private fire = (): void => {
        const onHold = this.onHold;
        this.disarm();
        // Nothing has moved yet at this point, so the tick is the only sign that the
        // press stopped being a tap and the marker is now under the finger.
        tickHaptic();
        onHold?.();
    };

    private disarm(): void {
        this.unwatchInterruptions();
        this.timeout = undefined;
        this.pointerId = undefined;
        this.origin = undefined;
        this.onHold = undefined;
        if (cancelArmedHold === this.cancel) {
            cancelArmedHold = undefined;
        }
    }

    private watchInterruptions(): void {
        // Capture, so a hold is dropped before the gesture it competes with gets to act on the same
        // event; the map surface itself only sees these while bubbling.
        window.addEventListener('pointerdown', this.cancelOnSecondPointer, true);
        window.addEventListener('pointermove', this.cancelOnDrift, true);
        window.addEventListener('pointerup', this.cancelOnRelease, true);
        window.addEventListener('pointercancel', this.cancelOnRelease, true);
        window.addEventListener('wheel', this.cancel, true);
        window.addEventListener('blur', this.cancel);
        window.addEventListener('visibilitychange', this.cancel);
    }

    private unwatchInterruptions(): void {
        window.removeEventListener('pointerdown', this.cancelOnSecondPointer, true);
        window.removeEventListener('pointermove', this.cancelOnDrift, true);
        window.removeEventListener('pointerup', this.cancelOnRelease, true);
        window.removeEventListener('pointercancel', this.cancelOnRelease, true);
        window.removeEventListener('wheel', this.cancel, true);
        window.removeEventListener('blur', this.cancel);
        window.removeEventListener('visibilitychange', this.cancel);
    }

    /** A second finger is a pinch about to zoom the map, never a hold on the marker below it. */
    private cancelOnSecondPointer = (event: PointerEvent): void => {
        if (event.pointerId !== this.pointerId) {
            this.cancel();
        }
    };

    private cancelOnDrift = (event: PointerEvent): void => {
        if (event.pointerId !== this.pointerId || !this.origin) {
            return;
        }
        const drift = Math.hypot(event.clientX - this.origin.x, event.clientY - this.origin.y);
        if (drift > DRIFT_TOLERANCE_PX) {
            this.cancel();
        }
    };

    /** A release before the hold matures is a tap, wherever on the page it lands. */
    private cancelOnRelease = (event: PointerEvent): void => {
        if (event.pointerId === this.pointerId) {
            this.cancel();
        }
    };
}
