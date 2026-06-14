<script lang="ts">
    import type {Component} from 'svelte';
    import {
        markerFilterState,
        toggleFilterSection,
        toggleFilterSelection,
        isFilterSelected,
        type FilterKind,
        type FilterOption,
    } from '$lib/state/markerFilter.svelte';
    import {highlight} from '$lib/utils/highlight';
    import CheckIcon from '@lucide/svelte/icons/check';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

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

<div class="border-border border-t first:border-t-0">
    <button
        type="button"
        onclick={() => toggleFilterSection(kind)}
        class="flex w-full items-center gap-2.5 px-2 py-3 text-sm font-semibold"
    >
        <Icon class="text-muted-foreground size-4" />
        {label}
        {#if selected.size > 0}
            <span
                class="bg-primary text-primary-foreground grid h-5 min-w-5 place-items-center
                    rounded-full px-1.5 text-[11px] font-bold"
            >
                {selected.size}
            </span>
        {/if}
        <span class="text-muted-foreground ml-auto text-xs tabular-nums">
            {query ? `${filtered.length} из ${options.length}` : options.length}
        </span>
        <ChevronDownIcon
            class="text-muted-foreground size-4 transition-transform {isOpen ? 'rotate-180' : ''}"
        />
    </button>

    {#if isOpen}
        <div class="px-1 pb-3">
            {#if filtered.length === 0}
                <p class="text-muted-foreground px-2 py-1 text-[13px]">Ничего не найдено</p>
            {:else if kind === 'categories'}
                {#each filtered as option (option.id)}
                    <button
                        type="button"
                        onclick={() => toggleFilterSelection(kind, option.id)}
                        class="hover:bg-muted/55 flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2 text-[13.5px]"
                    >
                        <span
                            class="size-3 flex-none rounded-full"
                            style="background: {option.color}"
                        ></span>
                        <span class="text-left">
                            {#each highlight(option.name, query) as part (part.text + part.hit)}
                                {#if part.hit}<mark
                                        class="rounded-[3px] bg-[color-mix(in_srgb,var(--warning)_55%,transparent)] px-px text-inherit"
                                    >
                                        {part.text}
                                    </mark>{:else}{part.text}{/if}
                            {/each}
                        </span>
                        <span
                            class="ml-auto grid size-[19px] flex-none place-items-center rounded-md border-[1.8px] transition-colors
                                {isFilterSelected(kind, option.id)
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border text-transparent'}"
                        >
                            <CheckIcon class="size-3" />
                        </span>
                    </button>
                {/each}
            {:else}
                <div class="flex flex-wrap gap-[7px] px-1 py-0.5">
                    {#each filtered as option (option.id)}
                        <button
                            type="button"
                            onclick={() => toggleFilterSelection(kind, option.id)}
                            class="flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors
                                {isFilterSelected(kind, option.id)
                                ? 'text-primary border-transparent bg-[color-mix(in_srgb,var(--primary)_12%,var(--card))] shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--primary)_35%,transparent)]'
                                : 'border-border hover:border-primary/40'}"
                        >
                            {#each highlight(option.name, query) as part (part.text + part.hit)}
                                {#if part.hit}<mark
                                        class="rounded-[3px] bg-[color-mix(in_srgb,var(--warning)_55%,transparent)] px-px text-inherit"
                                    >
                                        {part.text}
                                    </mark>{:else}{part.text}{/if}
                            {/each}
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>
