<script lang="ts">
    import type {Id} from '$convex/_generated/dataModel';
    import {categoriesState} from '$lib/state/categories.svelte';
    import {markerIconMap} from '$lib/services/map/markerStyling';
    import {cn} from '$lib/utils.ts';

    interface Props {
        name: string;
        // search results only carry the category name, so the id is optional
        // and styling falls back to a name lookup
        categoryId?: Id<'categories'> | null;
        showName?: boolean;
        size?: 'sm' | 'md';
        class?: string;
    }

    let {
        name,
        categoryId = null,
        showName = true,
        size = 'md',
        class: className = '',
    }: Props = $props();

    const category = $derived.by(() => {
        if (categoryId) {
            return categoriesState.categories[categoryId];
        }
        return Object.values(categoriesState.categories).find(item => item.name === name);
    });
    const icon = $derived(category ? markerIconMap[category.markerIcon] : undefined);
</script>

<span
    class={cn('inline-flex min-w-0 items-center', size === 'md' ? 'gap-1.5' : 'gap-1', className)}
>
    {#if category && icon}
        <span
            class={cn(
                'flex shrink-0 items-center justify-center rounded-full text-white dark:ring-1 dark:ring-white/20',
                size === 'md' ? 'size-5' : 'size-4',
            )}
            style="background-color: {category.markerColor}"
        >
            <icon.component class={cn(icon.className, size === 'md' ? 'size-3' : 'size-2.5')} />
        </span>
    {/if}
    {#if showName}
        <span class={cn('text-muted-foreground truncate', size === 'md' ? 'text-sm' : 'text-xs')}>
            {name}
        </span>
    {/if}
</span>
