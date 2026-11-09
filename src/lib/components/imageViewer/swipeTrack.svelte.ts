import {cubicOut} from 'svelte/easing';
import {Tween, prefersReducedMotion} from 'svelte/motion';
import type {DragHandlers} from './zoomGestures';
import type {Point} from './zoomPan';

export type SwipeTrackOptions = {
    getCount(): number;
    getIndex(): number;
    setIndex(index: number): void;
    close(): void;
};

const GAP = 16;
const SETTLE_MS = 250;
const DISMISS_PULL = 120;
const SWIPE_SHARE = 0.25;
const FLING_SPEED = 0.4;
const EDGE_RESISTANCE = 0.3;

/** A flick counts even when short, and a flick back undoes even a long drag. */
function isPastThreshold(travel: number, velocity: number, distance: number): boolean {
    const speed = velocity * Math.sign(travel);
    return speed > FLING_SPEED || (Math.abs(travel) > distance && speed > -FLING_SPEED);
}

/** A row of slides that follows the finger sideways to change photos and downwards to close. */
export class SwipeTrack implements DragHandlers {
    width = $state(0);
    private options: SwipeTrackOptions;
    private offset = new Tween(0, {easing: cubicOut});
    private pullOffset = new Tween(0, {easing: cubicOut});
    // where the track was when the drag caught it, possibly halfway through settling
    private base: number | null = null;

    constructor(options: SwipeTrackOptions) {
        this.options = options;
    }

    get pull() {
        return this.pullOffset.current;
    }

    /** `position` counts slides from the shown one. */
    locate(position: number): number {
        return position * (this.width + GAP) + this.offset.current;
    }

    // a quick run of swipes can leave the track several slides behind, so slides stay
    // rendered while still on screen, not just while they are neighbours
    isNear(position: number): boolean {
        return Math.abs(position) <= 1 || Math.abs(this.locate(position)) < this.width + GAP;
    }

    step = (direction: number) => {
        const next = this.options.getIndex() + direction;
        if (next >= 0 && next < this.options.getCount()) {
            this.options.setIndex(next);
            // the slides shift with the index, so the track jumps back by a slide to stay put
            void this.offset.set(this.offset.current + direction * (this.width + GAP), {
                duration: 0,
            });
        }
        this.settle();
    };

    drag = (travel: Point) => {
        this.base ??= this.offset.current;
        void this.offset.set(this.resistAtEdges(this.base + travel.x), {duration: 0});
        void this.pullOffset.set(travel.y, {duration: 0});
    };

    release = (travel: Point, velocity: Point) => {
        this.base = null;
        if (isPastThreshold(travel.y, velocity.y, DISMISS_PULL)) {
            this.options.close();
        } else if (isPastThreshold(travel.x, velocity.x, this.width * SWIPE_SHARE)) {
            this.step(-Math.sign(travel.x));
        } else {
            this.settle();
        }
    };

    cancel = () => {
        this.base = null;
        this.settle();
    };

    private settle() {
        const duration = prefersReducedMotion.current ? 0 : SETTLE_MS;
        void this.offset.set(0, {duration});
        void this.pullOffset.set(0, {duration});
    }

    private resistAtEdges(offset: number): number {
        const index = this.options.getIndex();
        const isPastEdge =
            (offset > 0 && index === 0) || (offset < 0 && index === this.options.getCount() - 1);
        return isPastEdge ? offset * EDGE_RESISTANCE : offset;
    }
}
