type DetailsExitGuard = (proceed?: () => void) => void;

let guard: DetailsExitGuard | null = null;

// The open card owns the unsaved-changes check, so the map routes its exits
// through whichever card is mounted instead of navigating past it.
export function registerDetailsExitGuard(next: DetailsExitGuard): () => void {
    guard = next;

    return () => {
        if (guard === next) {
            guard = null;
        }
    };
}

export function requestDetailsClose() {
    guard?.();
}

export function requestDetailsSwitch(open: () => void) {
    if (guard) {
        guard(open);
    } else {
        open();
    }
}
