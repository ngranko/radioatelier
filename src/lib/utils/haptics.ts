// Long enough to register as a tick against a finger, short enough not to read as a buzz.
const TICK_MS = 12;

/** Confirms a gesture that fired on its own timing rather than on a release. */
export function tickHaptic(): void {
    // Only Android exposes the vibration API; iOS Safari has no equivalent for the web.
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
        return;
    }

    navigator.vibrate(TICK_MS);
}
