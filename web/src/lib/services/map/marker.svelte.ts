import {map} from '$lib/stores/map';

export function setDraggable(isDraggable: boolean) {
    map.subscribe(value => {
        if (value) {
            value.set('draggable', isDraggable);
        }
    });
}