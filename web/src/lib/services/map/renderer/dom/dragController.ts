import type { Marker } from '$lib/services/map/marker';
import { mapState } from '$lib/state/map.svelte';
import { removeDragTimeout, setDragTimeout } from '$lib/state/marker.svelte';

export class DragController {
    public attach(marker: Marker): void {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        }
        
        this.attachClick(marker);
        this.attachDragIfNeeded(marker);
    }

    public detach(marker: Marker): void {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        }

        google.maps.event.clearInstanceListeners(raw);
        this.removeDomPointerListeners(marker);
        this.removeMapMoveListener(marker);
    }

    private attachPointerDown(marker: Marker): void {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        }
        
        const onPointerDown = this.handlePointerDown(marker);
        const element = raw.content as HTMLElement;
        element.addEventListener('pointerdown', onPointerDown);
        marker.pointerDownListener = onPointerDown;
    }

    private attachPointerUp(marker: Marker): void {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        }
        
        const onPointerUp = this.handlePointerUp(marker);
        const element = raw.content as HTMLElement;
        element.addEventListener('pointerup', onPointerUp);
        element.addEventListener('pointercancel', onPointerUp);
        marker.pointerUpListener = onPointerUp;
    }

    private attachClick(marker: Marker): void {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        }
        const onClick = marker.getOnClick();
        if (onClick) {
            raw.addListener('gmp-click', onClick);
        }
    }

    private attachDragIfNeeded(marker: Marker): void {
        if (!marker.isDraggable()) {
            return;
        }
        this.attachPointerDown(marker);
        this.attachPointerUp(marker);
    }

    private handlePointerDown(marker: Marker) {
        return () => {
            setDragTimeout(
                setTimeout(() => this.startDrag(marker), 300),
            );
        };
    }

    private startDrag(marker: Marker) {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        }
        marker.pointerMoveListener = this.createMapMoveListener(marker);
        const start = marker.getOnDragStart();
        start?.();
        (raw.content as HTMLElement).classList.add('marker-dragging');
    }

    private createMapMoveListener(marker: Marker): google.maps.MapsEventListener {
        return google.maps.event.addListener(
            mapState.map!,
            'mousemove',
            (event: google.maps.MapMouseEvent) => {
                marker.isDragged = true;
                marker.setPosition({lat: event.latLng!.lat(), lng: event.latLng!.lng()});
            },
        );
    }

    private handlePointerUp(marker: Marker) {
        return () => {
            removeDragTimeout();
            this.removeMapMoveListener(marker);
            if (marker.isDragged) {
                marker.isDragged = false;
                const end = marker.getOnDragEnd();
                end?.();
            }
            const raw = marker.getRaw();
            if (raw) {
                (raw.content as HTMLElement).classList.remove('marker-dragging');
            }
        };
    }

    private removeDomPointerListeners(marker: Marker) {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        }
        const element = raw.content as HTMLElement;
        if (marker.pointerDownListener) {
            element.removeEventListener('pointerdown', marker.pointerDownListener);
            marker.pointerDownListener = undefined;
        }
        if (marker.pointerUpListener) {
            element.removeEventListener('pointerup', marker.pointerUpListener);
            element.removeEventListener('pointercancel', marker.pointerUpListener);
            marker.pointerUpListener = undefined;
        }
    }

    private removeMapMoveListener(marker: Marker) {
        if (marker.pointerMoveListener) {
            google.maps.event.removeListener(marker.pointerMoveListener);
            marker.pointerMoveListener = undefined;
        }
    }
}