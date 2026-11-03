<script lang="ts">
    import {categoriesState} from '$lib/state/categories.svelte';
    import {
        pruneFilterSelection,
        selectedFilterCount,
        type FilterOption,
    } from '$lib/state/markerFilter.svelte';
    import {privateTagsState} from '$lib/state/privateTags.svelte';
    import {tagsState} from '$lib/state/tags.svelte';
    import MarkerFilterPanel from './markerFilterPanel.svelte';

    const categories = $derived<FilterOption[]>(
        Object.values(categoriesState.categories)
            .filter(category => !category.isHidden)
            .map(category => ({id: category.id, name: category.name}))
            .sort((a, b) => a.name.localeCompare(b.name)),
    );

    const tags = $derived<FilterOption[]>(tagsState.tags);

    const privateTags = $derived<FilterOption[]>(privateTagsState.privateTags);

    // options are live: hiding a category or deleting a tag must not leave
    // an invisible selection behind that still counts toward the filter
    $effect(() => {
        pruneFilterSelection('categories', categories);
        pruneFilterSelection('tags', tags);
        pruneFilterSelection('privateTags', privateTags);
    });

    // TODO(wire): replace with real visible-marker totals once filtering is implemented.
    const STUB_TOTAL = 137;
    const shown = $derived(
        selectedFilterCount() > 0
            ? Math.max(1, STUB_TOTAL - selectedFilterCount() * 9)
            : STUB_TOTAL,
    );
</script>

<MarkerFilterPanel {categories} {tags} {privateTags} total={STUB_TOTAL} {shown} />
