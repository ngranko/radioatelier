import type {Marker} from '$lib/services/map/marker';
import type {DeckOverlayHost} from '$lib/services/map/providers/google/deckOverlayHost';
import type {ClusteredPoint} from '$lib/services/map/renderer/clustered/markerClusterIndex';
import {removeDragTimeout, setDragTimeout} from '$lib/state/marker.svelte';

const HOLD_MS = 300;
const PICK_RADIUS_PX = 4;

interface GestureHandlers {
    onHold(marker: Marker): void;
    onRelease(): void;
}

/**
 * GPU markers have no element to press on, so the hold that starts a reposition is detected against
 * deck's picking buffer instead. The marker is then handed to the DOM renderer, which already owns
 * dragging and its pulse animation.
 */
export class SpriteDragGesture {
    private activePointerId?: number;

    public constructor(
        private container: HTMLElement,
        private overlay: DeckOverlayHost,
        private handlers: GestureHandlers,
    ) {}

    public attach(): void {
        this.container.addEventListener('pointerdown', this.handlePointerDown);
        // The release is watched globally: a drag that started on a sprite can end anywhere.
        window.addEventListener('pointerup', this.handlePointerUp);
        window.addEventListener('pointercancel', this.handlePointerUp);
    }

    public detach(): void {
        this.container.removeEventListener('pointerdown', this.handlePointerDown);
        window.removeEventListener('pointerup', this.handlePointerUp);
        window.removeEventListener('pointercancel', this.handlePointerUp);
        this.activePointerId = undefined;
        removeDragTimeout();
    }

    private handlePointerDown = (event: PointerEvent): void => {
        // A second finger landing mid-hold must not restart the gesture on another marker.
        if (this.activePointerId !== undefined || !event.isPrimary || event.button !== 0) {
            return;
        }

        const marker = this.draggableAt(event);
        if (!marker) {
            return;
        }
        this.activePointerId = event.pointerId;
        setDragTimeout(window.setTimeout(() => this.handlers.onHold(marker), HOLD_MS));
    };

    private handlePointerUp = (event: PointerEvent): void => {
        // Only the pointer that began the hold ends it; another one lifting leaves the drag alive.
        if (event.pointerId !== this.activePointerId) {
            return;
        }

        this.activePointerId = undefined;
        removeDragTimeout();
        this.handlers.onRelease();
    };

    private draggableAt(event: PointerEvent): Marker | undefined {
        const {left, top} = this.container.getBoundingClientRect();
        const picked = this.overlay.pickAt(
            event.clientX - left,
            event.clientY - top,
            PICK_RADIUS_PX,
        ) as ClusteredPoint | undefined;

        return picked?.kind === 'marker' && picked.marker.options.isDraggable
            ? picked.marker
            : undefined;
    }
}
