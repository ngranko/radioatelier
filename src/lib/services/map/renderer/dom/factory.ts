import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';

export class Factory {
    public constructor(private provider: MapProvider) {}

    public create(marker: Marker): void {
        const content = this.createMarkerContent(marker);
        const handle = this.provider.createMarkerHandle(marker.getPosition(), content, {
            zIndex: marker.getZIndex(),
        });
        marker.setHandle(handle);
    }

    /** Only the style-independent shell; the renderer paints it via applyMarkerAppearance. */
    private createMarkerContent(marker: Marker): HTMLElement {
        const markerElement = document.createElement('div');
        markerElement.className = `w-6 h-6 translate-y-1/2 flex justify-center items-center rounded-full transition-transform transition-opacity duration-100 ease-in-out text-sm ${marker.isServiceMarker() ? '' : 'text-white'}`;
        return markerElement;
    }
}
