<script lang="ts">
    import type {Id} from '$convex/_generated/dataModel';
    import CategoryBadge from '$lib/components/categoryBadge.svelte';
    import {
        markerFilterState,
        toggleFilterSection,
        toggleFilterSelection,
        isFilterSelected,
        type FilterKind,
        type FilterOption,
    } from '$lib/state/markerFilter.svelte';
    import {cn} from '$lib/utils.js';
    import {highlight} from '$lib/utils/highlight';
    import CheckIcon from '@lucide/svelte/icons/check';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
    import type {Component} from 'svelte';

    interface Props {
        kind: FilterKind;
        label: string;
        icon: Component;
        options: FilterOption[];
    }

    let {kind, label, icon: Icon, options}: Props = $props();

    const query = $derived(markerFilterState.query.trim());
    const selected = $derived(markerFilterState.selected[kind]);
    const filtered = $derived(
        query ? options.filter(o => o.name.toLowerCase().includes(query.toLowerCase())) : options,
    );
    // a live query force-opens sections that have matches
    const isOpen = $derived(query ? filtered.length > 0 : markerFilterState.sections[kind]);
</script>

<!-- whitespace between the segments would render as gaps inside the name -->
<!-- prettier-ignore -->
{#snippet highlightedName(name: string)}{#each highlight(name, query) as part, index (index)}{#if part.hit}<mark class="bg-primary/20 rounded-sm text-inherit">{part.text}</mark>{:else}{part.text}{/if}{/each}{/snippet}

{#if options.length > 0}
    <div class="border-t first:border-t-0">
        <button
            type="button"
            onclick={() => toggleFilterSection(kind)}
            aria-expanded={isOpen}
            class="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium"
        >
            <Icon class="text-muted-foreground size-4" />
            {label}
            {#if selected.size > 0}
                <span
                    class="bg-primary text-primary-foreground grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs"
                >
                    {selected.size}
                </span>
            {/if}
            <span class="text-muted-foreground ml-auto text-xs font-normal tabular-nums">
                {query ? `${filtered.length} из ${options.length}` : options.length}
            </span>
            <ChevronDownIcon
                class={cn(
                    'text-muted-foreground size-4 transition-transform',
                    isOpen && 'rotate-180',
                )}
            />
        </button>

        {#if isOpen && kind === 'categories'}
            <div class="px-1 pb-2">
                {#each filtered as option (option.id)}
                    {@const isSelected = isFilterSelected(kind, option.id)}
                    <button
                        type="button"
                        onclick={() => toggleFilterSelection(kind, option.id)}
                        aria-pressed={isSelected}
                        class={cn(
                            'hover:bg-accent flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm',
                            isSelected && 'font-medium',
                        )}
                    >
                        <CheckIcon class={cn('size-3.5 shrink-0', !isSelected && 'opacity-0')} />
                        <CategoryBadge
                            name={option.name}
                            categoryId={option.id as Id<'categories'>}
                            showName={false}
                            size="sm"
                        />
                        <span class="min-w-0 flex-1 break-words">
                            {@render highlightedName(option.name)}
                        </span>
                    </button>
                {/each}
            </div>
        {:else if isOpen}
            <div class="flex flex-wrap gap-1.5 px-4 pb-3">
                {#each filtered as option (option.id)}
                    {@const isSelected = isFilterSelected(kind, option.id)}
                    <button
                        type="button"
                        onclick={() => toggleFilterSelection(kind, option.id)}
                        aria-pressed={isSelected}
                        class={cn(
                            'max-w-full rounded-md border px-2 py-1 text-left text-xs font-medium break-words lowercase transition-colors',
                            isSelected
                                ? 'text-primary border-primary/15 bg-primary/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                        )}
                    >
                        {@render highlightedName(option.name)}
                    </button>
                {/each}
            </div>
        {/if}
    </div>
{/if}
