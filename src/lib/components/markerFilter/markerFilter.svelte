<script lang="ts">
    import {categoriesState} from '$lib/state/categories.svelte';
    import {selectedFilterCount, type FilterOption} from '$lib/state/markerFilter.svelte';
    import {privateTagsState} from '$lib/state/privateTags.svelte';
    import {tagsState} from '$lib/state/tags.svelte';
    import MarkerFilterPanel from './markerFilterPanel.svelte';

    // Categories are real (already loaded into categoriesState).
    const categories = $derived<FilterOption[]>(
        Object.values(categoriesState.categories)
            .filter(category => !category.isHidden)
            .map(category => ({
                id: category.id,
                name: category.name,
                color: category.markerColor,
            })),
    );

    const tags = $derived<FilterOption[]>(tagsState.tags);

    const privateTags = $derived<FilterOption[]>(privateTagsState.privateTags);

    // TODO(wire): replace with real visible-marker totals once filtering is implemented.
    const STUB_TOTAL = 137;
    const shown = $derived(
        selectedFilterCount() > 0
            ? Math.max(1, STUB_TOTAL - selectedFilterCount() * 9)
            : STUB_TOTAL,
    );
</script>

<MarkerFilterPanel {categories} {tags} {privateTags} total={STUB_TOTAL} {shown} />
