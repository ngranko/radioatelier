<script lang="ts">
    import {selectedFilterCount, toggleMarkerFilter} from '$lib/state/markerFilter.svelte';
    import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';

    const count = $derived(selectedFilterCount());
</script>

<button
    type="button"
    onclick={toggleMarkerFilter}
    aria-label="Фильтр по категориям и тегам"
    class="text-muted-foreground hover:text-foreground hover:bg-foreground/8 before:bg-foreground/15 absolute top-1/2
        right-1 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full
        transition-colors before:absolute before:top-1.5 before:bottom-1.5 before:-left-1 before:w-px
        {count > 0 ? 'text-primary hover:text-primary hover:bg-primary/14' : ''}"
>
    <SlidersHorizontalIcon class="size-4" />
    {#if count > 0}
        <span
            class="bg-primary text-primary-foreground absolute -top-1 -right-1 grid h-[18px] min-w-[18px]
                place-items-center rounded-full px-[5px] text-[11px] leading-none font-bold
                ring-2 ring-white/90 dark:ring-[oklch(0.28_0.04_260)]"
        >
            {count}
        </span>
    {/if}
</button>
