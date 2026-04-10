import type {Id} from '$convex/_generated/dataModel';
import type {MarkerColor, MarkerIconKey} from '$lib/services/map/markerStyling.data';

export interface Category {
    id: Id<'categories'>;
    name: string;
    markerColor: MarkerColor;
    markerIcon: MarkerIconKey;
    isHidden: boolean;
}
