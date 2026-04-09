import type {Id} from '$convex/_generated/dataModel';

export interface Category {
    id: Id<'categories'>;
    name: string;
    markerColor: string;
    markerIcon: string;
    isHidden: boolean;
}
