import type {Marker} from '$lib/services/map/marker';
import {markerLifecycle} from '$lib/services/map/markerLifecycle';
import type {DeckOverlayHost} from '$lib/services/map/providers/google/deckOverlayHost';
import {buildMarkerLayers} from '$lib/services/map/renderer/gpu/markerLayers';
import {toMarkerPoints} from '$lib/services/map/renderer/gpu/markerPoints';
import {SpriteExitTracker, type SpriteExit} from '$lib/services/map/renderer/gpu/spriteExits';
import {
    SPRITE_FADE_MS,
    type SpriteFade,
    SpriteFadeTracker,
} from '$lib/services/map/renderer/gpu/spriteFades';
import {SPRITE_POP_OUT_MS} from '$lib/services/map/renderer/gpu/spritePopExtension';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';

const RENDER_DEBOUNCE_MS = 16;

export class GpuMarkerRenderer implements MarkerRenderer {
    private markers = new Set<Marker>();
    private fadeTracker = new SpriteFadeTracker();
    private exitTracker = new SpriteExitTracker();
    private excludedMarker?: Marker;
    private scheduled = false;
    private renderTimeout?: ReturnType<typeof setTimeout>;
    private renderFrame?: number;
    private fadeTimeout?: ReturnType<typeof setTimeout>;
    private exitTimeout?: ReturnType<typeof setTimeout>;

    public constructor(
        private overlay: DeckOverlayHost,
        private onInteraction: () => void,
    ) {
        this.overlay.attach();
    }

    public ensureCreated(marker: Marker): void {
        this.markers.add(marker);
        this.scheduleRender();
    }

    public syncAll(iterable: Iterable<Marker>): void {
        this.markers = new Set(iterable);
        this.scheduleRender();
    }

    public show(): void {}

    public hide(): void {}

    public remove(marker: Marker, onRemoved?: () => void): void {
        this.markers.delete(marker);
        if (this.excludedMarker === marker) {
            // The DOM twin owns this one's exit; a sprite copy would animate on top of it.
            this.excludedMarker = undefined;
        } else {
            this.exitTracker.keep(marker);
        }
        this.scheduleRender();
        onRemoved?.();
    }

    public applyState(_marker: Marker): void {
        this.scheduleRender();
    }

    public setExcludedMarker(marker: Marker | undefined): void {
        if (marker === this.excludedMarker) {
            return;
        }
        this.excludedMarker = marker;
        // The caller swaps only once the DOM twin has been painted, so the two overlap for a frame
        // by design. Batching would stretch that overlap across the debounce too: harmless for an
        // opaque marker, but a removed one is translucent and composites over itself into a
        // visibly darker marker.
        this.renderNow();
    }

    public destroy(): void {
        this.markers.clear();
        this.dropPendingRender();
        if (this.fadeTimeout !== undefined) {
            clearTimeout(this.fadeTimeout);
        }
        if (this.exitTimeout !== undefined) {
            clearTimeout(this.exitTimeout);
        }
        this.exitTracker.clear();
        this.overlay.detach();
    }

    private renderNow(): void {
        this.dropPendingRender();
        this.render();
    }

    private dropPendingRender(): void {
        if (this.renderTimeout !== undefined) {
            clearTimeout(this.renderTimeout);
            this.renderTimeout = undefined;
        }
        if (this.renderFrame !== undefined) {
            cancelAnimationFrame(this.renderFrame);
            this.renderFrame = undefined;
        }
        this.cancelScheduled();
    }

    private scheduleRender(): void {
        if (this.scheduled) {
            return;
        }
        this.scheduled = true;
        markerLifecycle.begin();
        this.renderTimeout = setTimeout(() => {
            this.renderTimeout = undefined;
            this.renderFrame = requestAnimationFrame(() => {
                this.renderFrame = undefined;
                this.scheduled = false;
                try {
                    this.render();
                } finally {
                    markerLifecycle.end();
                }
            });
        }, RENDER_DEBOUNCE_MS);
    }

    private render(): void {
        const points = toMarkerPoints(this.renderedMarkers());
        const fades = this.fadeTracker.track(points);
        const exits = this.exitTracker.listActive();
        this.overlay.setLayers(
            buildMarkerLayers(
                points,
                {fades, exits},
                {
                    onMarkerClick: marker => this.handleMarkerClick(marker),
                },
            ),
        );
        this.keepFadesRunning(fades);
        this.keepExitsRunning(exits);
    }

    /** The shader animates the exit; this render only takes the finished sprites back out. */
    private keepExitsRunning(exits: SpriteExit[]): void {
        if (exits.length === 0 || this.exitTimeout !== undefined) {
            return;
        }
        this.exitTimeout = setTimeout(() => {
            this.exitTimeout = undefined;
            this.scheduleRender();
        }, SPRITE_POP_OUT_MS);
    }

    /** A fade needs a second render to ease from and a last one to drop it once it has run out. */
    private keepFadesRunning(fades: SpriteFade[]): void {
        if (fades.some(fade => fade.fresh)) {
            this.scheduleRender();
            return;
        }
        if (fades.length === 0 || this.fadeTimeout !== undefined) {
            return;
        }
        this.fadeTimeout = setTimeout(() => {
            this.fadeTimeout = undefined;
            this.scheduleRender();
        }, SPRITE_FADE_MS);
    }

    private *renderedMarkers(): Iterable<Marker> {
        for (const marker of this.markers) {
            if (marker !== this.excludedMarker) {
                yield marker;
            }
        }
    }

    private handleMarkerClick(marker: Marker): void {
        this.onInteraction();
        marker.options.onClick?.();
    }

    private cancelScheduled(): void {
        if (!this.scheduled) {
            return;
        }
        this.scheduled = false;
        markerLifecycle.end();
    }
}
