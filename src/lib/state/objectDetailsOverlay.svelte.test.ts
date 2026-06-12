import type {PointPreviewDetails} from '$lib/interfaces/object';
import {beforeEach, describe, expect, it} from 'vitest';
import {
    closeDetailsOverlay,
    enterEditMode,
    objectDetailsOverlay,
    returnToViewMode,
    setOverlayAddressLoading,
    setOverlayDirty,
    setOverlayMinimized,
    showLoadingDetailsOverlay,
    showObjectDetailsOverlay,
    showPointCreateOverlay,
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
        setOverlayDirty(true);
        setOverlayMinimized(true);
        setOverlayAddressLoading(true);

        showLoadingDetailsOverlay('object-1');

        expect(objectDetailsOverlay.isOpen).toBe(true);
        expect(objectDetailsOverlay.isLoading).toBe(true);
        expect(objectDetailsOverlay.detailsId).toBe('object-1');
        expect(objectDetailsOverlay.isDirty).toBe(false);
        expect(objectDetailsOverlay.isMinimized).toBe(false);
        expect(objectDetailsOverlay.isAddressLoading).toBe(false);
        expect(objectDetailsOverlay.mode).toBe('objectView');
        expect(objectDetailsOverlay.pointDetails).toBeUndefined();
    });

    it('keeps previous details when reopening without fresh values', () => {
        showObjectDetailsOverlay('object-1', {name: 'Plaque'} as never);
        showObjectDetailsOverlay('object-1');

        expect(objectDetailsOverlay.details).toEqual({name: 'Plaque'});
    });

    it('mode verbs move between view and edit without touching the rest', () => {
        showObjectDetailsOverlay('object-1');
        setOverlayDirty(true);

        enterEditMode();
        expect(objectDetailsOverlay.mode).toBe('objectEdit');
        expect(objectDetailsOverlay.isDirty).toBe(true);

        returnToViewMode();
        expect(objectDetailsOverlay.mode).toBe('objectView');
        expect(objectDetailsOverlay.detailsId).toBe('object-1');
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
