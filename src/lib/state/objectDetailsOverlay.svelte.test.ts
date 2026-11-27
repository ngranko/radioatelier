import type {PointPreviewDetails} from '$lib/interfaces/object';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
    closeDetailsOverlay,
    enterEditMode,
    objectDetailsOverlay,
    returnToViewMode,
    setOverlayAddressLoading,
    setOverlayPosition,
    showLoadingDetailsOverlay,
    showLoadingPointOverlay,
    showObjectDetailsOverlay,
    showPointCreateOverlay,
    showPointPreviewOverlay,
} from './objectDetailsOverlay.svelte.ts';

const pointDetails: PointPreviewDetails = {
    latitude: 55.75,
    longitude: 37.61,
    name: 'Mosaic',
    categoryName: 'mosaic',
    address: 'Tverskaya 1',
    city: 'Moscow',
    country: 'Russia',
    type: 'map',
    googlePlaceId: null,
};

describe('objectDetailsOverlay transitions', () => {
    beforeEach(() => {
        closeDetailsOverlay();
    });

    it('opening resets leftovers from the previous overlay', () => {
        showPointCreateOverlay('point-1', {name: 'Draft'}, pointDetails);
        setOverlayPosition('minimized');
        setOverlayAddressLoading(true);

        showLoadingDetailsOverlay('object-1');

        expect(objectDetailsOverlay.isOpen).toBe(true);
        expect(objectDetailsOverlay.isLoading).toBe(true);
        expect(objectDetailsOverlay.detailsId).toBe('object-1');
        expect(objectDetailsOverlay.isMinimized).toBe(false);
        expect(objectDetailsOverlay.isAddressLoading).toBe(false);
        expect(objectDetailsOverlay.mode).toBe('objectView');
        expect(objectDetailsOverlay.pointDetails).toBeUndefined();
    });

    it('keeps edit state when current object details refresh', () => {
        showObjectDetailsOverlay('object-1', {name: 'Plaque'} as never);
        enterEditMode();
        setOverlayPosition('minimized');

        showObjectDetailsOverlay('object-1', {name: 'Updated plaque'} as never);

        expect(objectDetailsOverlay.mode).toBe('objectEdit');
        expect(objectDetailsOverlay.isMinimized).toBe(true);
        expect(objectDetailsOverlay.details).toEqual({name: 'Updated plaque'});
    });

    it('resets edit state when opening after close', () => {
        showObjectDetailsOverlay('object-1', {name: 'Plaque'} as never);
        enterEditMode();
        closeDetailsOverlay();

        showObjectDetailsOverlay('object-2', {name: 'Mosaic'} as never);

        expect(objectDetailsOverlay.detailsId).toBe('object-2');
        expect(objectDetailsOverlay.mode).toBe('objectView');
    });

    it('hands a picked cover to the next edit only', () => {
        showObjectDetailsOverlay('object-1');
        const cover = new File([], 'cover.jpg', {type: 'image/jpeg'});

        enterEditMode(cover);
        expect(objectDetailsOverlay.pendingCoverFile).toBe(cover);

        returnToViewMode();
        enterEditMode();
        expect(objectDetailsOverlay.pendingCoverFile).toBeUndefined();
    });

    it('close clears everything unless details are preserved', () => {
        showObjectDetailsOverlay('object-1', {name: 'Plaque'} as never);
        closeDetailsOverlay();
        expect(objectDetailsOverlay.isOpen).toBe(false);
        expect(objectDetailsOverlay.details).toBeUndefined();

        showObjectDetailsOverlay('object-1', {name: 'Plaque'} as never);
        closeDetailsOverlay({preserveDetails: true});
        expect(objectDetailsOverlay.isOpen).toBe(false);
        expect(objectDetailsOverlay.details).toEqual({name: 'Plaque'});
    });
});

describe('point overlay position', () => {
    const point = {latitude: 55.75, longitude: 37.61};

    beforeEach(() => {
        closeDetailsOverlay();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('opens a point at peek on phones and keeps a later drag across re-syncs', () => {
        vi.stubGlobal('document', {body: {clientWidth: 390}});

        showLoadingPointOverlay('point-1', point);
        expect(objectDetailsOverlay.position).toBe('peek');
        showPointPreviewOverlay('point-1', {}, pointDetails);
        expect(objectDetailsOverlay.position).toBe('peek');

        setOverlayPosition('full');
        showPointPreviewOverlay('point-1', {}, pointDetails);
        expect(objectDetailsOverlay.position).toBe('full');
    });

    it('expands to full when creating from a peeking preview', () => {
        vi.stubGlobal('document', {body: {clientWidth: 390}});
        showPointPreviewOverlay('point-1', {}, pointDetails);

        showPointCreateOverlay('point-1', {}, pointDetails);

        expect(objectDetailsOverlay.position).toBe('full');
    });
});
