<script lang="ts">
    import {
        clearMarkerFilter,
        toggleFilterSelection,
        type TrayItem,
    } from '$lib/state/markerFilter.svelte';
    import XIcon from '@lucide/svelte/icons/x';

    let {items}: {items: TrayItem[]} = $props();
</script>

{#if items.length > 0}
    <div class="border-border flex flex-wrap gap-1.5 border-b px-3.5 py-2.5">
        {#each items as item (item.kind + item.id)}
            {@const Icon = item.icon}
            <span
                class="text-primary inline-flex h-[27px] items-center gap-1.5 rounded-full
                    bg-[color-mix(in_srgb,var(--primary)_13%,var(--card))] py-0 pr-[5px] pl-[9px]
                    text-xs font-medium shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
            >
                {#if item.color}
                    <span class="size-2 rounded-full" style="background: {item.color}"></span>
                {:else if Icon}
                    <Icon class="size-[11px]" />
                {/if}
                {item.name}
                <button
                    type="button"
                    onclick={() => toggleFilterSelection(item.kind, item.id)}
                    aria-label="Убрать {item.name}"
                    class="grid size-[17px] place-items-center rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)]"
                >
                    <XIcon class="size-2.5" />
                </button>
            </span>
        {/each}
        {#if items.length > 1}
            <button
                type="button"
                onclick={clearMarkerFilter}
                class="text-muted-foreground px-2 text-xs font-semibold"
            >
                Очистить всё
            </button>
        {/if}
    </div>
{/if}
