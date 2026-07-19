import {describe, expect, it} from 'vitest';

import {getSettledPosition, heightForPosition} from './sheetSnap';

describe('object details sheet snapping', () => {
    const viewportHeight = 800;

    it('keeps the nearest position for a slow short drag', () => {
        const releaseHeight = 610;

        expect(
            getSettledPosition(
                releaseHeight,
                viewportHeight,
                {height: 650, time: 0},
                {height: releaseHeight, time: 400},
            ),
        ).toBe('full');
    });

    it('uses release velocity to continue a deliberate downward flick', () => {
        const releaseHeight = 610;

        expect(
            getSettledPosition(
                releaseHeight,
                viewportHeight,
                {height: 690, time: 80},
                {height: releaseHeight, time: 160},
            ),
        ).toBe('peek');
    });

    it('uses release velocity to continue a deliberate upward flick', () => {
        const peekHeight = heightForPosition('peek', viewportHeight);
        const releaseHeight = peekHeight + 120;

        expect(
            getSettledPosition(
                releaseHeight,
                viewportHeight,
                {height: releaseHeight - 70, time: 40},
                {height: releaseHeight, time: 100},
            ),
        ).toBe('full');
    });
});
