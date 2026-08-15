import {MARKER_COLORS, MARKER_ICON_KEYS} from '$lib/services/map/markerStyling.data';
import {categoriesState} from '$lib/state/categories.svelte';

export function debugMarkerStyle() {
    const category = Object.values(categoriesState.categories)[0];
    return {
        color: category?.markerColor ?? MARKER_COLORS[0],
        iconKey: category?.markerIcon ?? MARKER_ICON_KEYS[0],
    };
}
