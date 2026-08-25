import type {Marker} from '$lib/services/map/marker';
import type {MarkerPoint} from '$lib/services/map/renderer/gpu/markerPoints';
import {markerSpriteFor, type MarkerSprite} from '$lib/services/map/renderer/gpu/markerSprites';

export const SPRITE_FADE_MS = 160;

export interface SpriteFade {
    point: MarkerPoint;
    sprite: MarkerSprite;
    /** True only on the frame a fade appears, where it renders opaque so deck.gl has a value to ease down from. */
    fresh: boolean;
}

interface TrackedFade extends SpriteFade {
    expiresAt: number;
}

/**
 * A sprite swap is instantaneous, so state changes used to pop. Keeping the outgoing sprite alive
 * for one transition and fading it out over the incoming one restores the crossfade the separate
 * halo/disk/icon layers used to get from deck.gl colour transitions.
 */
export class SpriteFadeTracker {
    private sprites = new Map<Marker, MarkerSprite>();
    private fades = new Map<Marker, TrackedFade>();

    /** Outgoing sprites to draw over the current ones, newest first render included. */
    public track(points: MarkerPoint[]): SpriteFade[] {
        const now = Date.now();
        const previous = this.sprites;
        this.sprites = new Map();

        for (const point of points) {
            // Halo-less, so an unchanged halo is never composited over itself mid-fade.
            const sprite = markerSpriteFor(point.marker, false);
            this.sprites.set(point.marker, sprite);
            this.refresh(point, previous.get(point.marker), sprite, now);
        }

        return this.active(now);
    }

    private refresh(
        point: MarkerPoint,
        previous: MarkerSprite | undefined,
        sprite: MarkerSprite,
        now: number,
    ): void {
        if (previous && previous.id !== sprite.id) {
            this.fades.set(point.marker, {
                point,
                sprite: previous,
                fresh: true,
                expiresAt: now + SPRITE_FADE_MS,
            });
            return;
        }
        const fade = this.fades.get(point.marker);
        if (fade) {
            fade.point = point;
        }
    }

    private active(now: number): SpriteFade[] {
        const active: SpriteFade[] = [];
        for (const [marker, fade] of this.fades) {
            if (!this.sprites.has(marker) || (!fade.fresh && now >= fade.expiresAt)) {
                this.fades.delete(marker);
                continue;
            }
            active.push({point: fade.point, sprite: fade.sprite, fresh: fade.fresh});
            fade.fresh = false;
        }
        return active;
    }
}
