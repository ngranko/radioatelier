<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {
        markerFilterState,
        selectedFilterCount,
        toggleMarkerFilter,
    } from '$lib/state/markerFilter.svelte';
    import {cn} from '$lib/utils.js';
    import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';

    const count = $derived(selectedFilterCount());
</script>

<Button
    variant="ghost"
    size="icon"
    onclick={toggleMarkerFilter}
    aria-label="Фильтр по категориям и тегам"
    aria-expanded={markerFilterState.isOpen}
    class={cn(
        'before:bg-foreground/15 absolute top-1/2 right-1 z-10 h-8 w-8 -translate-y-1/2 rounded-full transition-colors',
        'before:absolute before:top-1.5 before:bottom-1.5 before:-left-1 before:w-px',
        count > 0
            ? 'text-primary hover:text-primary'
            : 'text-muted-foreground hover:text-foreground',
    )}
>
    <SlidersHorizontalIcon />
    {#if count > 0}
        <span
            class="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] leading-none"
        >
            {count}
        </span>
    {/if}
</Button>
