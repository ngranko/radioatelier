import {describe, expect, it} from 'vitest';
import {detailsFocusOffsets, usesSidePanelOffset} from './detailsFocusOffset';

describe('usesSidePanelOffset', () => {
    it('uses the side-panel offset on wide viewports', () => {
        expect(usesSidePanelOffset(824)).toBe(true);
        expect(usesSidePanelOffset(1200)).toBe(true);
    });

    it('skips the side-panel offset on narrow viewports', () => {
        expect(usesSidePanelOffset(823)).toBe(false);
        expect(usesSidePanelOffset(390)).toBe(false);
    });
});

describe('detailsFocusOffsets', () => {
    const mobile = {
        lat: 0,
        zoom: 15,
        viewportWidth: 390,
        viewportHeight: 800,
    };

    it('applies a westward lng offset on desktop regardless of sheet position', () => {
        for (const overlayPosition of ['minimized', 'peek', 'full'] as const) {
            const offset = detailsFocusOffsets({
                lat: 0,
                zoom: 15,
                viewportWidth: 1200,
                viewportHeight: 800,
                overlayPosition,
            });

            expect(offset.latOffset).toBe(0);
            expect(offset.lngOffset).toBeLessThan(0);
        }
    });

    it('centers with no offset for mobile full and minimized', () => {
        for (const overlayPosition of ['full', 'minimized'] as const) {
            expect(detailsFocusOffsets({...mobile, overlayPosition})).toEqual({
                latOffset: 0,
                lngOffset: 0,
            });
        }
    });

    it('offsets mobile peek by the peek overlay height', () => {
        const offset = detailsFocusOffsets({...mobile, overlayPosition: 'peek'});
        const peekHeight = Math.round(800 * 0.42);
        const degreesPerPixel = 360 / (256 * 2 ** 15);

        expect(offset.lngOffset).toBe(0);
        expect(offset.latOffset).toBeCloseTo(-peekHeight * degreesPerPixel);
        expect(offset.latOffset).toBeLessThan(0);
    });
});
