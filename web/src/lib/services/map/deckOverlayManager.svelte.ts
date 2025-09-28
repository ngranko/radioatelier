import {DeckOverlayController, type DeckItem} from '$lib/services/map/deckOverlay';
import {get} from 'svelte/store';
import {pointList as pointListStore} from '$lib/stores/map';
import config from '$lib/config';
import type { PointListItem } from '$lib/interfaces/object';
import type KeyVal from '$lib/interfaces/keyVal';
import { mapState } from '$lib/state/map.svelte';

export async function initDeckOverlay(): Promise<DeckOverlayController | null> {
    const pointListSnapshot = get(pointListStore) as unknown as KeyVal<PointListItem>;

    if (!mapState.map || !mapState.markerManager) {
        console.log('map or marker manager is not set, cannot init deck');
        return null;
    }

    let controller: DeckOverlayController | null = new DeckOverlayController(mapState.map);
    try {
        await controller.init();
        if (shouldUseDeck(mapState.map)) {
            controller.rebuild(computeDeckItems(pointListSnapshot));
            controller.setEnabled(true);
            mapState.markerManager.disableMarkers();
        }
    } catch (e) {
        controller = null;
        mapState.deckEnabled = false;
        console.warn('Deck.gl overlay failed to initialize; continuing without it.', e);
    }

    return controller;
}

export function shouldUseDeck(map: google.maps.Map): boolean {
    return (map.getZoom() ?? 15) <= config.deckZoomThreshold;
}

export function computeDeckItems(pointList: KeyVal<PointListItem>): DeckItem[] {
    const items = Object.values(pointList).map(p => ({
        id: p.object.id,
        position: [Number(p.object.lng), Number(p.object.lat)] as [number, number],
        isVisited: p.object.isVisited,
        isRemoved: p.object.isRemoved,
        isSearch: false,
    }));
    return [...items];
}
