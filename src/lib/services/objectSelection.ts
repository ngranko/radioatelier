import {goto} from '$app/navigation';
import {page} from '$app/state';
import {api} from '$convex/_generated/api';
import type {Id} from '$convex/_generated/dataModel';
import type {MapPlaceable, SearchItem} from '$lib/interfaces/object';
import {setCreateDraftPosition} from '$lib/state/createDraft.svelte';
import {mapState} from '$lib/state/map.svelte';
import {closeMarkerFilter} from '$lib/state/markerFilter.svelte';
import {
    closeDetailsOverlay,
    objectDetailsOverlay,
    showLoadingDetailsOverlay,
    showObjectDetailsOverlay,
} from '$lib/state/objectDetailsOverlay.svelte';
import {getActiveSearchUrl} from '$lib/state/search.svelte';
import {
    clearSelectedSearchPoint,
    removeSearchPoint,
    selectSearchPoint,
} from '$lib/state/searchPointList.svelte';
import {clearSharedMarker, sharedMarker} from '$lib/state/sharedMarker.svelte';
import {requestDetailsSwitch} from '$lib/utils/detailsExit';
import {buildPointUrl} from '$lib/utils/pointRoute';
import type {ConvexClient} from 'convex/browser';
import {setFocusedTarget} from './map/markerFocus';
import {stopPointingAtAllMarkers} from './map/markerHover';

export function selectObject(id: Id<'objects'>, position: MapPlaceable) {
    requestSelection(id, () => {
        clearSelectedSearchPoint();
        if (page.params.id === id) {
            showObjectDetailsOverlay(id);
        } else {
            showLoadingDetailsOverlay(id, position);
            void goto(`/object/${id}`);
        }
    });
}

export function selectSearchResult(item: SearchItem) {
    if (item.id) {
        selectObject(item.id, item);
        return;
    }
    const id = item.googlePlaceId ?? `${item.latitude},${item.longitude}`;
    requestSelection(id, () => {
        selectSearchPoint({object: item});
        showLoadingDetailsOverlay(id, item);
        void goto(buildPointUrl({...item, placeId: item.googlePlaceId}));
    });
}

export function selectMapPoint(position: MapPlaceable) {
    const id = `${position.latitude},${position.longitude}`;
    requestSelection(id, () => {
        clearSelectedSearchPoint();
        setCreateDraftPosition({lat: position.latitude, lng: position.longitude});
        showLoadingDetailsOverlay(id, position);
        void goto(buildPointUrl(position));
    });
}

export function closeObjectSelection(preserveDetails = false) {
    setCreateDraftPosition(null);
    clearSelectedSearchPoint();
    closeDetailsOverlay({preserveDetails});
    if (mapState.isReady) {
        mapState.provider?.closeStreetView();
    }
}

export function focusObjectSelection() {
    // Sheet snaps must refocus even when the selected Marker has not registered yet.
    const {details, detailsId, position} = objectDetailsOverlay;
    void position;
    if (!mapState.isReady) {
        return;
    }
    const coordinates =
        details?.latitude !== undefined && details.longitude !== undefined
            ? {lat: details.latitude, lng: details.longitude}
            : undefined;
    setFocusedTarget(detailsId || null, coordinates);
}

export async function closeDeletedObject(id: Id<'objects'>, client: Pick<ConvexClient, 'query'>) {
    if (!isSelected(id)) {
        return;
    }
    // A failed details query can also mean broken relations; verify deletion before closing.
    const object = await client.query(api.objects.resolveShareId, {id});
    if (object || !isSelected(id)) {
        return;
    }
    removeSearchPoint(id);
    if (sharedMarker.object?.id === id) {
        clearSharedMarker();
    }
    closeObjectSelection();
    await goto(getActiveSearchUrl(), {replaceState: true});
}

function isSelected(id: string) {
    return objectDetailsOverlay.isOpen && objectDetailsOverlay.detailsId === id;
}

function requestSelection(id: string, open: () => void) {
    if (isSelected(id)) {
        return;
    }
    const accept = () => {
        stopPointingAtAllMarkers();
        closeMarkerFilter();
        open();
        focusObjectSelection();
    };
    if (objectDetailsOverlay.isOpen) {
        requestDetailsSwitch(accept);
    } else {
        accept();
    }
}
