import type {MapProvider} from '$lib/interfaces/map';
import type {RendererFactory} from '$lib/services/map/markerManager';
import {ClusteredHybridRenderer} from '$lib/services/map/providers/google/clusteredHybridRenderer';
import {HybridMarkerRenderer} from '$lib/services/map/providers/google/hybridMarkerRenderer';
import {DomMarkerRenderer} from '$lib/services/map/renderer/domMarkerRenderer';

export function createMarkerRenderer(
    provider: MapProvider,
    clusteredRendererEnabled: boolean,
    onInteraction: () => void,
): RendererFactory {
    return mode => {
        if (clusteredRendererEnabled) {
            return new ClusteredHybridRenderer(provider, onInteraction);
        }
        if (mode === 'deck') {
            return new HybridMarkerRenderer(provider);
        }
        return new DomMarkerRenderer(provider);
    };
}
