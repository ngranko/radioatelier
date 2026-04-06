import type {LatLngLiteral, MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {removeDragTimeout, setDragTimeout} from '$lib/state/marker.svelte';

export class DragController {
    private skipClick = false;

    public constructor(private provider: MapProvider) {}

    public attach(marker: Marker): void {
        const handle = marker.getHandle();
        if (!handle) {
            return;
        }

        this.attachClick(marker);
        this.attachDragIfNeeded(marker);
    }

    public detach(marker: Marker): void {
        marker.unsubClick?.();
        marker.unsubClick = undefined;
        this.removeDomPointerListeners(marker);
        this.removeMapMoveListener(marker);
    }

    private attachClick(marker: Marker): void {
        const handle = marker.getHandle();
        if (!handle) {
            return;
        }

        marker.unsubClick?.();
        marker.unsubClick = handle.addClickListener(this.handleClick(marker));
    }

    private handleClick(marker: Marker) {
        return () => {
            if (this.skipClick) {
                this.skipClick = false;
                return;
            }
            marker.getOnClick()?.();
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
        const element = marker.getHandle()?.getElement();
        if (!element) {
            return;
        }

        marker.unsubPointerDown?.();
        const handler = this.handlePointerDown(marker);
        element.addEventListener('pointerdown', handler);
        marker.unsubPointerDown = () => element.removeEventListener('pointerdown', handler);
    }

    private handlePointerDown(marker: Marker) {
        return () => {
            setDragTimeout(window.setTimeout(() => this.startDrag(marker), 300));
        };
    }

    private startDrag(marker: Marker) {
        const element = marker.getHandle()?.getElement();
        if (!element) {
            return;
        }
        marker.unsubPointerMove = this.provider.onPointerMove((latLng: LatLngLiteral) => {
            marker.isDragged = true;
            marker.setPosition(latLng);
        });
        this.skipClick = true;
        this.provider.setDraggable(false);
        marker.getOnDragStart()?.();
        element.classList.add('marker-dragging');
    }

    private attachPointerUp(marker: Marker): void {
        const element = marker.getHandle()?.getElement();
        if (!element) {
            return;
        }

        marker.unsubPointerUp?.();
        const handler = this.handlePointerUp(marker);
        element.addEventListener('pointerup', handler);
        element.addEventListener('pointercancel', handler);
        marker.unsubPointerUp = () => {
            element.removeEventListener('pointerup', handler);
            element.removeEventListener('pointercancel', handler);
        };
    }

    private handlePointerUp(marker: Marker) {
        return () => {
            removeDragTimeout();
            this.removeMapMoveListener(marker);
            this.provider.setDraggable(true);
            if (marker.isDragged) {
                marker.isDragged = false;
                marker.getOnDragEnd()?.();
            }
            marker.getHandle()?.getElement()?.classList.remove('marker-dragging');

            // gmp-click often does not fire after drag release; skipClick would otherwise stay true.
            setTimeout(() => {
                if (this.skipClick) {
                    this.skipClick = false;
                }
            }, 0);
        };
    }

    private removeMapMoveListener(marker: Marker) {
        if (marker.unsubPointerMove) {
            marker.unsubPointerMove();
            marker.unsubPointerMove = undefined;
        }
    }

    private removeDomPointerListeners(marker: Marker) {
        marker.unsubPointerDown?.();
        marker.unsubPointerDown = undefined;
        marker.unsubPointerUp?.();
        marker.unsubPointerUp = undefined;
    }
}
