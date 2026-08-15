import {debugMarkerStyle} from '$lib/services/debug/debugMarkerStyle';
import {generateViewportPositions, rectAround} from '$lib/services/debug/generatePositions';
import {clampMarkerCount} from '$lib/services/debug/markerCount';
import {profileMarkerOperation} from '$lib/services/debug/profileMarkerOperation';
import {mapState} from '$lib/state/map.svelte';
import {debugMarkerState, type DebugMarkerItem} from '$lib/state/debugMarkers.svelte';

export async function addDebugMarkers(): Promise<void> {
    if (!canStartAdd()) {
        return;
    }

    const count = clampMarkerCount(debugMarkerState.count);
    debugMarkerState.count = count;
    await runProfiled('add', count, () => {
        debugMarkerState.items = createDebugMarkers(count);
    });
}

export async function removeDebugMarkers(): Promise<void> {
    const count = debugMarkerState.items.length;
    if (!canStartRemove(count)) {
        return;
    }

    await runProfiled('remove', count, () => {
        debugMarkerState.items = [];
    });
}

function canStartAdd(): boolean {
    return (
        mapState.isReady &&
        !debugMarkerState.runningOperation &&
        debugMarkerState.items.length === 0
    );
}

function canStartRemove(count: number): boolean {
    return mapState.isReady && !debugMarkerState.runningOperation && count > 0;
}

async function runProfiled(
    operation: 'add' | 'remove',
    markerCount: number,
    run: () => void,
): Promise<void> {
    debugMarkerState.runningOperation = operation;
    try {
        debugMarkerState.lastResult = await profileMarkerOperation({
            operation,
            markerCount,
            renderer: mapState.markerManager?.isDeckRenderer ? 'deck' : 'dom',
            run,
        });
    } finally {
        debugMarkerState.runningOperation = null;
    }
}

function createDebugMarkers(count: number): DebugMarkerItem[] {
    const style = debugMarkerStyle();
    const prefix = `debug-${Date.now()}`;
    return generateViewportPositions(count, currentRect()).map((position, index) => ({
        id: `${prefix}-${index}`,
        lat: position.lat,
        lng: position.lng,
        color: style.color,
        iconKey: style.iconKey,
    }));
}

function currentRect() {
    return (
        mapState.provider?.getBounds()?.toRect() ??
        rectAround(mapState.provider?.getCenter() ?? {lat: 0, lng: 0})
    );
}
