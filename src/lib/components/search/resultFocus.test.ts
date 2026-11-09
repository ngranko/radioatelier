import {describe, expect, it, vi} from 'vitest';
import {focusAdjacentResult, focusSearchResults, getAdjacentResultIndex} from './resultFocus';

describe('getAdjacentResultIndex', () => {
    it('enters the list from the end the key points at', () => {
        expect(getAdjacentResultIndex(-1, 1, 3)).toBe(0);
        expect(getAdjacentResultIndex(-1, -1, 3)).toBe(2);
    });

    it('wraps around both ends', () => {
        expect(getAdjacentResultIndex(2, 1, 3)).toBe(0);
        expect(getAdjacentResultIndex(0, -1, 3)).toBe(2);
    });
});

function createResult(visible = true, inert = false) {
    return {
        checkVisibility: () => visible,
        closest: () => (inert ? {} : null),
        focus: vi.fn(),
    };
}

function createOrigin(items: ReturnType<typeof createResult>[]) {
    return {closest: () => ({querySelectorAll: () => items})} as unknown as HTMLElement;
}

describe('focusAdjacentResult', () => {
    it('skips hidden and inert results when entering the list', () => {
        const hidden = createResult(false);
        const inert = createResult(true, true);
        const visible = createResult();
        expect(focusAdjacentResult(createOrigin([hidden, inert, visible]), 1)).toBe(true);
        expect(visible.focus).toHaveBeenCalledOnce();
        expect(hidden.focus).not.toHaveBeenCalled();
        expect(inert.focus).not.toHaveBeenCalled();
    });
});

describe('focusSearchResults', () => {
    it('retains the search scope when the preview trigger is removed', async () => {
        const focus = vi.fn();
        const querySelector = vi.fn(() => ({focus}));
        const closest = vi.fn(() => ({querySelector}));
        const pending = focusSearchResults({closest} as unknown as HTMLElement);
        closest.mockReturnValue(null as never);
        expect(focus).not.toHaveBeenCalled();
        await pending;
        expect(querySelector).toHaveBeenCalledWith('[role="tab"][aria-selected="true"]');
        expect(focus).toHaveBeenCalledOnce();
    });
});
