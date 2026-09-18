import {prefersReducedMotion} from 'svelte/motion';

/** Collapses a transition to an instant swap for anyone who asked for less motion. */
export function respectReducedMotion(duration: number): number {
    return prefersReducedMotion.current ? 0 : duration;
}
