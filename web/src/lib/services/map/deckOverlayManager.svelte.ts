import {deckEnabled} from '$lib/stores/map';
import {DeckOverlayController, type DeckItem} from '$lib/services/map/deckOverlay';
import {get} from 'svelte/store';
import {map as mapStore, markerManager as markerManagerStore, pointList as pointListStore} from '$lib/stores/map';
import config from '$lib/config';
import type { PointListItem } from '$lib/interfaces/object';
import type KeyVal from '$lib/interfaces/keyVal';

export async function initDeckOverlay(): Promise<DeckOverlayController | null> {
    const mapInstance = get(mapStore);
    const markerManagerInstance = get(markerManagerStore);
    const pointListSnapshot = get(pointListStore) as unknown as KeyVal<PointListItem>;

    if (!mapInstance || !markerManagerInstance) {
        console.log('map or marker manager is not set, cannot init deck');
        return null;
    }

    let controller: DeckOverlayController | null = new DeckOverlayController(mapInstance);
    try {
        await controller.init();
        if (shouldUseDeck(mapInstance)) {
            markerManagerInstance.disableMarkers();
            controller.setEnabled(true);
            controller.rebuild(computeDeckItems(pointListSnapshot));
        }
    } catch (e) {
        controller = null;
        deckEnabled.set(false);
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
