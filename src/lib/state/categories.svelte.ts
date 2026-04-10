import type {Id} from '$convex/_generated/dataModel';
import type {Category} from '$lib/interfaces/category';
import {
    MARKER_COLORS,
    MARKER_ICON_KEYS,
    type MarkerColor,
    type MarkerIconKey,
} from '$lib/services/map/markerStyling.data';

interface CategoriesState {
    list: Category[];
    categories: {[id: Id<'categories'>]: Category};
}

type RawCategory = Omit<Category, 'markerColor' | 'markerIcon'> & {
    markerColor: string;
    markerIcon: string;
};

export const categoriesState = $state<CategoriesState>({list: [], categories: {}});

function isMarkerColor(value: string): value is MarkerColor {
    return MARKER_COLORS.includes(value as MarkerColor);
}

function isMarkerIconKey(value: string): value is MarkerIconKey {
    return MARKER_ICON_KEYS.includes(value as MarkerIconKey);
}

export function setCategories(categories: RawCategory[]) {
    console.log(categories);
    const byId = {} as {[id: Id<'categories'>]: Category};
    const normalizedCategories: Category[] = [];

    for (const item of categories) {
        if (byId[item.id]) {
            continue;
        }

        const normalizedCategory: Category = {
            ...item,
            markerColor: isMarkerColor(item.markerColor) ? item.markerColor : MARKER_COLORS[0],
            markerIcon: isMarkerIconKey(item.markerIcon) ? item.markerIcon : MARKER_ICON_KEYS[0],
        };

        byId[normalizedCategory.id] = normalizedCategory;
        normalizedCategories.push(normalizedCategory);
    }

    categoriesState.list = normalizedCategories;
    categoriesState.categories = byId;
}
