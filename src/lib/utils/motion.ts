import {cubicInOut} from 'svelte/easing';
import {prefersReducedMotion} from 'svelte/motion';
import {fly, type TransitionConfig} from 'svelte/transition';

/** Collapses a transition to an instant swap for anyone who asked for less motion. */
export function respectReducedMotion(duration: number): number {
    return prefersReducedMotion.current ? 0 : duration;
}

/** The side panels come in from, and leave through, the left edge they are pinned to. */
export function slideFromLeft(node: Element): TransitionConfig {
    return fly(node, {x: -100, duration: respectReducedMotion(200), easing: cubicInOut});
}
