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
    public width = $state(0);
    private options: SwipeTrackOptions;
    private offset = new Tween(0, {easing: cubicOut});
    private pullOffset = new Tween(0, {easing: cubicOut});
    // Where the drag caught the track, possibly halfway through settling. It is kept in finger
    // travel rather than on-screen offset, so an edge pull caught mid-settle isn't resisted twice.
    private base: number | null = null;
    private pointers = new Set<number>();
    private isSuspended = false;

    public constructor(options: SwipeTrackOptions) {
        this.options = options;
    }

    public get pull() {
        return this.pullOffset.current;
    }

    /** `position` counts slides from the shown one. */
    public locate(position: number): number {
        return position * (this.width + GAP) + this.offset.current;
    }

    // a quick run of swipes can leave the track several slides behind, so slides stay
    // rendered while still on screen, not just while they are neighbours
    public isNear(position: number): boolean {
        return Math.abs(position) <= 1 || Math.abs(this.locate(position)) < this.width + GAP;
    }

    public attach(node: HTMLElement) {
        const listeners = new AbortController();
        const {signal} = listeners;
        node.addEventListener('pointerdown', event => this.countPress(event), {signal});
        // a lift can land outside the track, and a stage holding the pointer can unmount
        window.addEventListener('pointerup', event => this.countLift(event), {signal});
        window.addEventListener('pointercancel', event => this.countLift(event), {signal});
        return () => listeners.abort();
    }

    public step(direction: number) {
        // the finger holding the track decides where it goes; a key or button press would
        // otherwise shift the slides out from under it
        if (this.base !== null) {
            return;
        }
        const next = this.options.getIndex() + direction;
        if (next >= 0 && next < this.options.getCount()) {
            this.options.setIndex(next);
            // the slides shift with the index, so the track jumps back by a slide to stay put
            void this.offset.set(this.offset.current + direction * (this.width + GAP), {
                duration: 0,
            });
        }
        this.settle();
    }

    public drag(travel: Point) {
        if (this.isSuspended) {
            return;
        }
        this.base ??= this.offset.current / this.measureEdgeResistance(this.offset.current);
        const offset = this.base + travel.x;
        void this.offset.set(offset * this.measureEdgeResistance(offset), {duration: 0});
        void this.pullOffset.set(travel.y, {duration: 0});
    }

    public release(travel: Point, velocity: Point) {
        this.base = null;
        if (this.isSuspended) {
            return;
        }
        if (isPastThreshold(travel.y, velocity.y, DISMISS_PULL)) {
            this.options.close();
        } else if (isPastThreshold(travel.x, velocity.x, this.width * SWIPE_SHARE)) {
            this.step(-Math.sign(travel.x));
        } else {
            this.settle();
        }
    }

    public cancel() {
        this.base = null;
        this.settle();
    }

    // Each photo's stage only sees the fingers on itself, so one landing on a neighbouring photo
    // mid-swipe would go unnoticed there. Counted across the whole track, a second finger cancels
    // the swipe until every finger is lifted, as it does within a single stage.
    private countPress(event: PointerEvent) {
        this.pointers.add(event.pointerId);
        if (this.pointers.size > 1 && !this.isSuspended) {
            this.isSuspended = true;
            this.cancel();
        }
    }

    private countLift(event: PointerEvent) {
        this.pointers.delete(event.pointerId);
        if (this.pointers.size === 0) {
            this.isSuspended = false;
        }
    }

    private settle() {
        const duration = prefersReducedMotion.current ? 0 : SETTLE_MS;
        void this.offset.set(0, {duration});
        void this.pullOffset.set(0, {duration});
    }

    private measureEdgeResistance(offset: number): number {
        const index = this.options.getIndex();
        const isPastEdge =
            (offset > 0 && index === 0) || (offset < 0 && index === this.options.getCount() - 1);
        return isPastEdge ? EDGE_RESISTANCE : 1;
    }
}
