import type {Id} from '$convex/_generated/dataModel';
import posthog from 'posthog-js';
import {SvelteSet} from 'svelte/reactivity';

export const MARKER_FILTER_FLAG = 'marker-filter-panel';

export type FilterKind = 'categories' | 'tags' | 'privateTags';

export interface FilterOption {
    id: string;
    name: string;
}

export interface TrayItem extends FilterOption {
    kind: FilterKind;
}

interface MarkerFilterState {
    isEnabled: boolean;
    isOpen: boolean;
    query: string;
    sections: Record<FilterKind, boolean>;
    selected: {
        categories: SvelteSet<Id<'categories'>>;
        tags: SvelteSet<Id<'tags'>>;
        privateTags: SvelteSet<Id<'privateTags'>>;
    };
}

export const markerFilterState = $state<MarkerFilterState>({
    isEnabled: false,
    isOpen: false,
    query: '',
    sections: {categories: true, tags: false, privateTags: false},
    selected: {
        categories: new SvelteSet(),
        tags: new SvelteSet(),
        privateTags: new SvelteSet(),
    },
});

export function isFilterSelected(kind: FilterKind, id: string): boolean {
    return (markerFilterState.selected[kind] as SvelteSet<string>).has(id);
}

export function selectedFilterCount(): number {
    const {categories, tags, privateTags} = markerFilterState.selected;
    return categories.size + tags.size + privateTags.size;
}

export function watchMarkerFilterFlag(): () => void {
    return posthog.onFeatureFlags(() => {
        markerFilterState.isEnabled = Boolean(posthog.isFeatureEnabled(MARKER_FILTER_FLAG));
    });
}

export function openMarkerFilter(): void {
    markerFilterState.isOpen = true;
}

export function closeMarkerFilter(): void {
    markerFilterState.isOpen = false;
    markerFilterState.query = '';
}

export function toggleMarkerFilter(): void {
    if (markerFilterState.isOpen) {
        closeMarkerFilter();
    } else {
        openMarkerFilter();
    }
}

export function toggleFilterSection(kind: FilterKind): void {
    markerFilterState.sections[kind] = !markerFilterState.sections[kind];
}

export function toggleFilterSelection(kind: FilterKind, id: string): void {
    const set = markerFilterState.selected[kind] as SvelteSet<string>;
    if (set.has(id)) {
        set.delete(id);
    } else {
        set.add(id);
    }
}

export function clearMarkerFilter(): void {
    markerFilterState.selected.categories.clear();
    markerFilterState.selected.tags.clear();
    markerFilterState.selected.privateTags.clear();
}
