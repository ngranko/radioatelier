import {goto} from '$app/navigation';
import type {Id} from '$convex/_generated/dataModel';
import {
    enterEditMode,
    objectDetailsOverlay,
    showObjectDetailsOverlay,
} from '$lib/state/objectDetailsOverlay.svelte';
import {replaceSearchPointList, searchPointList} from '$lib/state/searchPointList.svelte';
import {setSharedMarkerObject, sharedMarker} from '$lib/state/sharedMarker.svelte';
import type {ConvexClient} from 'convex/browser';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {closeDeletedObject, selectObject} from './objectSelection';
import {createSearchItem, holdSelection, resetSelection} from './objectSelectionTestHelpers';

vi.mock('$app/navigation', () => ({goto: vi.fn().mockResolvedValue(undefined)}));
vi.mock('$app/state', () => ({page: {params: {id: undefined}}}));

const objectId = 'object-1' as Id<'objects'>;

beforeEach(resetSelection);

describe('Object selection lifetime', () => {
    it('closes confirmed deletion and clears shared and search pins without a discard prompt', async () => {
        showObjectDetailsOverlay(objectId);
        enterEditMode();
        holdSelection();
        setSharedMarkerObject({id: objectId} as never);
        replaceSearchPointList([{object: createSearchItem({id: objectId})}]);
        const query = vi.fn<ConvexClient['query']>().mockResolvedValue(null);

        await closeDeletedObject(objectId, {query});

        expect(objectDetailsOverlay.isOpen).toBe(false);
        expect(sharedMarker.object).toBeUndefined();
        expect(Object.keys(searchPointList)).toEqual([]);
        expect(goto).toHaveBeenCalledWith('/', {replaceState: true});
    });

    it('keeps details open when a failed query belongs to an Object that still exists', async () => {
        showObjectDetailsOverlay(objectId);
        const query = vi.fn<ConvexClient['query']>().mockResolvedValue({canonicalId: objectId});

        await closeDeletedObject(objectId, {query});

        expect(objectDetailsOverlay.isOpen).toBe(true);
        expect(goto).not.toHaveBeenCalled();
    });

    it('does not close a newer selection after an older deletion check completes', async () => {
        showObjectDetailsOverlay(objectId);
        const response = Promise.withResolvers<null>();
        const query = vi.fn<ConvexClient['query']>().mockReturnValue(response.promise);
        const check = closeDeletedObject(objectId, {query});
        selectObject('object-2' as Id<'objects'>, {latitude: 10, longitude: 20});

        response.resolve(null);
        await check;

        expect(objectDetailsOverlay).toMatchObject({isOpen: true, detailsId: 'object-2'});
        expect(goto).toHaveBeenLastCalledWith('/object/object-2');
    });
});
