import type {MapProvider} from '$lib/interfaces/map';
import type {RendererFactory} from '$lib/services/map/markerManager';
import {GpuHybridRenderer} from '$lib/services/map/providers/google/gpuHybridRenderer';
import {HybridMarkerRenderer} from '$lib/services/map/providers/google/hybridMarkerRenderer';
import {DomMarkerRenderer} from '$lib/services/map/renderer/domMarkerRenderer';

export function createMarkerRenderer(
    provider: MapProvider,
    gpuRendererEnabled: boolean,
    onInteraction: () => void,
): RendererFactory {
    return mode => {
        if (gpuRendererEnabled) {
            return new GpuHybridRenderer(provider, onInteraction);
        }
        if (mode === 'deck') {
            return new HybridMarkerRenderer(provider);
        }
        return new DomMarkerRenderer(provider);
    };
}
