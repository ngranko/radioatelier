import type {Marker} from '$lib/services/map/marker';
import {
    markerSpriteFor,
    type MarkerSprite,
} from '$lib/services/map/renderer/clustered/markerSprites';
import {SPRITE_POP_OUT_MS} from '$lib/services/map/renderer/clustered/spritePopExtension';
import {popClock} from '$lib/services/map/renderer/clustered/spriteSpawns';

export interface SpriteExit {
    position: [number, number];
    sprite: MarkerSprite;
    leftAt: number;
}

/**
 * A removed marker is gone from the layer's data at once, so its exit is drawn from a copy of what
 * it looked like. Nothing downstream waits on the animation, and the marker itself can be dropped
 * the moment it is removed.
 */
export class SpriteExitTracker {
    private exits: SpriteExit[] = [];

    public keep(marker: Marker): void {
        const {lat, lng} = marker.getPosition();
        this.exits.push({
            position: [lng, lat],
            sprite: markerSpriteFor(marker),
            leftAt: popClock(),
        });
    }

    /** The exits still on screen, oldest first. */
    public active(): SpriteExit[] {
        const now = popClock();
        this.exits = this.exits.filter(exit => now - exit.leftAt < SPRITE_POP_OUT_MS);
        return this.exits;
    }

    public clear(): void {
        this.exits = [];
    }
}

export function latestExitTime(exits: SpriteExit[]): number {
    return exits.length === 0 ? 0 : Math.max(...exits.map(exit => exit.leftAt));
}
