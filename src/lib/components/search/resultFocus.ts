import {tick} from 'svelte';

/** Index of the result an arrow key moves to, wrapping around both ends of the list. */
export function getAdjacentResultIndex(currentIndex: number, step: number, total: number): number {
    if (total <= 0) {
        return -1;
    }

    // Focus usually sits in the search field rather than on a result, and the first
    // press has to reach the end of the list the key points at.
    if (currentIndex < 0) {
        return step > 0 ? 0 : total - 1;
    }

    return (currentIndex + step + total) % total;
}

/** Direction an arrow key walks the result list in; 0 for every other key. */
export function readArrowStep(key: string): number {
    if (key === 'ArrowDown') {
        return 1;
    }
    if (key === 'ArrowUp') {
        return -1;
    }
    return 0;
}

/**
 * Moves focus from the search field or a result to its neighbour, and reports whether
 * there was one to move to.
 */
export function focusAdjacentResult(origin: HTMLElement, step: number): boolean {
    const scope = origin.closest('[data-search-scope]');
    if (!scope) {
        return false;
    }

    const items = Array.from(scope.querySelectorAll<HTMLElement>('[data-search-item]')).filter(
        item => item.checkVisibility() && !item.closest('[inert]'),
    );
    const nextIndex = getAdjacentResultIndex(items.indexOf(origin), step, items.length);
    const next = items[nextIndex];
    if (!next) {
        return false;
    }

    next.focus();
    return true;
}

export async function focusSearchResults(origin: HTMLElement): Promise<void> {
    const scope = origin.closest('[data-search-scope]');
    await tick();
    scope?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
}
