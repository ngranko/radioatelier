import { mapState } from '$lib/state/map.svelte';

export function setDraggable(isDraggable: boolean) {
    if (mapState.map) {
        mapState.map.set('draggable', isDraggable);
    }
}