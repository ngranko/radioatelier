<script lang="ts">
    import {categoriesState} from '$lib/state/categories.svelte';
    import {selectedFilterCount, type FilterOption} from '$lib/state/markerFilter.svelte';
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

    // TODO(wire): replace these stubs with api.tags.list / api.privateTags.list.
    const tags: FilterOption[] = [
        'советское',
        'модерн',
        'конструктивизм',
        'кириллица',
        'металл',
        'керамика',
        'дореволюционное',
        'неон',
        'утрачено',
        'ар-деко',
        'мозаика',
        'барельеф',
        'агитация',
        'герб',
        'звезда',
        'орнамент',
        'шрифтовая',
        'витраж',
    ].map((name, index) => ({id: `stub-tag-${index}`, name}));

    const privateTags: FilterOption[] = [
        'надо снять заново',
        'под угрозой сноса',
        'мой район',
        'избранное',
    ].map((name, index) => ({id: `stub-private-${index}`, name}));

    // TODO(wire): replace with real visible-marker totals once filtering is implemented.
    const STUB_TOTAL = 137;
    const shown = $derived(
        selectedFilterCount() > 0
            ? Math.max(1, STUB_TOTAL - selectedFilterCount() * 9)
            : STUB_TOTAL,
    );
</script>

<MarkerFilterPanel {categories} {tags} {privateTags} total={STUB_TOTAL} {shown} />
