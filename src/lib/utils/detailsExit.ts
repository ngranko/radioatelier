type DetailsExitGuard = (proceed?: () => void) => void;

let activeGuard: DetailsExitGuard | null = null;

// The open card owns the unsaved-changes check, so the map routes its exits
// through whichever card is mounted instead of navigating past it.
export function registerDetailsExitGuard(guard: DetailsExitGuard): () => void {
    activeGuard = guard;

    return () => {
        if (activeGuard === guard) {
            activeGuard = null;
        }
    };
}

export function requestDetailsClose() {
    activeGuard?.();
}

export function requestDetailsSwitch(open: () => void) {
    if (activeGuard) {
        activeGuard(open);
    } else {
        open();
    }
}
