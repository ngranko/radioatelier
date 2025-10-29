import type {Marker} from '$lib/services/map/marker';
import {mapState} from '$lib/state/map.svelte';
import {removeDragTimeout, setDragTimeout} from '$lib/state/marker.svelte';
import {setDraggable} from '../../map.svelte';

export class DragController {
    private skipClick = false;

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

    private attachClick(marker: Marker): void {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        }

        if (marker.clickListener) {
            google.maps.event.removeListener(marker.clickListener);
            marker.clickListener = undefined;
        }

        marker.clickListener = raw.addListener('gmp-click', this.handleClick(marker));
    }

    private handleClick(marker: Marker) {
        return () => {
            if (this.skipClick) {
                this.skipClick = false;
                return;
            }
            const onClick = marker.getOnClick();
            onClick?.();
        };
    }

    private attachDragIfNeeded(marker: Marker): void {
        if (!marker.isDraggable()) {
            return;
        }
        this.attachPointerDown(marker);
        this.attachPointerUp(marker);
    }

    private attachPointerDown(marker: Marker): void {
        const markerContent = marker.getRaw()?.content;
        if (!markerContent || !(markerContent instanceof HTMLElement)) {
            return;
        }

        if (marker.pointerDownListener) {
            markerContent.removeEventListener('pointerdown', marker.pointerDownListener);
        }

        const onPointerDown = this.handlePointerDown(marker);
        markerContent.addEventListener('pointerdown', onPointerDown);
        marker.pointerDownListener = onPointerDown;
    }

    private handlePointerDown(marker: Marker) {
        return () => {
            setDragTimeout(setTimeout(() => this.startDrag(marker), 300));
        };
    }

    private startDrag(marker: Marker) {
        const markerContent = marker.getRaw()?.content;
        if (!markerContent || !(markerContent instanceof HTMLElement)) {
            return;
        }
        marker.pointerMoveListener = this.createMapMoveListener(marker);
        this.skipClick = true;
        setDraggable(false);
        const start = marker.getOnDragStart();
        start?.();
        markerContent.classList.add('marker-dragging');
    }

    private createMapMoveListener(marker: Marker): google.maps.MapsEventListener {
        if (!mapState.map) {
            throw new Error('Map is not initialized');
        }

        return google.maps.event.addListener(
            mapState.map,
            'mousemove',
            (event: google.maps.MapMouseEvent) => {
                if (!event.latLng) {
                    return;
                }

                marker.isDragged = true;
                marker.setPosition({lat: event.latLng.lat(), lng: event.latLng.lng()});
            },
        );
    }

    private attachPointerUp(marker: Marker): void {
        const markerContent = marker.getRaw()?.content;
        if (!markerContent || !(markerContent instanceof HTMLElement)) {
            return;
        }

        if (marker.pointerUpListener) {
            markerContent.removeEventListener('pointerup', marker.pointerUpListener);
            markerContent.removeEventListener('pointercancel', marker.pointerUpListener);
        }

        const onPointerUp = this.handlePointerUp(marker);
        markerContent.addEventListener('pointerup', onPointerUp);
        markerContent.addEventListener('pointercancel', onPointerUp);
        marker.pointerUpListener = onPointerUp;
    }

    private handlePointerUp(marker: Marker) {
        return () => {
            removeDragTimeout();
            this.removeMapMoveListener(marker);
            setDraggable(true);
            if (marker.isDragged) {
                marker.isDragged = false;
                const end = marker.getOnDragEnd();
                end?.();
            }
            const markerContent = marker.getRaw()?.content;
            if (markerContent && markerContent instanceof HTMLElement) {
                markerContent.classList.remove('marker-dragging');
            }
        };
    }

    private removeMapMoveListener(marker: Marker) {
        if (marker.pointerMoveListener) {
            google.maps.event.removeListener(marker.pointerMoveListener);
            marker.pointerMoveListener = undefined;
        }
    }

    private removeDomPointerListeners(marker: Marker) {
        const markerContent = marker.getRaw()?.content;
        if (!markerContent || !(markerContent instanceof HTMLElement)) {
            return;
        }

        if (marker.pointerDownListener) {
            markerContent.removeEventListener('pointerdown', marker.pointerDownListener);
            marker.pointerDownListener = undefined;
        }

        if (marker.pointerUpListener) {
            markerContent.removeEventListener('pointerup', marker.pointerUpListener);
            markerContent.removeEventListener('pointercancel', marker.pointerUpListener);
            marker.pointerUpListener = undefined;
        }
    }
}
