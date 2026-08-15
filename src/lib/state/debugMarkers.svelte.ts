import {DEBUG_MARKER_DEFAULT} from '$lib/services/debug/markerCount';
import type {ProfileOperation, ProfileResult} from '$lib/services/debug/profileMarkerOperation';
import type {MarkerIconKey} from '$lib/services/map/markerStyling.data';

export interface DebugMarkerItem {
    id: string;
    lat: number;
    lng: number;
    color: string;
    iconKey: MarkerIconKey;
}

interface DebugMarkerState {
    count: number;
    items: DebugMarkerItem[];
    runningOperation: ProfileOperation | null;
    lastResult: ProfileResult | null;
}

export const debugMarkerState = $state<DebugMarkerState>({
    count: DEBUG_MARKER_DEFAULT,
    items: [],
    runningOperation: null,
    lastResult: null,
});
