<script lang="ts">
    import type {Id} from '$convex/_generated/dataModel';
    import CategoryBadge from '$lib/components/categoryBadge.svelte';
    import TagChip from '$lib/components/tagChip.svelte';
    import {Badge} from '$lib/components/ui/badge';
    import {toggleFilterSelection, type TrayItem} from '$lib/state/markerFilter.svelte';
    import XIcon from '@lucide/svelte/icons/x';

    let {items}: {items: TrayItem[]} = $props();
</script>

{#if items.length > 0}
    <div class="flex flex-wrap gap-1.5 border-b px-3 py-2.5">
        {#each items as item (item.kind + item.id)}
            {#if item.kind === 'categories'}
                <Badge variant="secondary" title={item.name} class="max-w-full min-w-0 pr-1">
                    <CategoryBadge
                        name={item.name}
                        categoryId={item.id as Id<'categories'>}
                        showName={false}
                        size="sm"
                    />
                    <span class="truncate">{item.name}</span>
                    <button
                        type="button"
                        onclick={() => toggleFilterSelection(item.kind, item.id)}
                        aria-label="Убрать {item.name}"
                        class="shrink-0 rounded-sm p-1 hover:bg-current/10"
                    >
                        <XIcon class="size-3.5" />
                    </button>
                </Badge>
            {:else}
                <TagChip
                    name={item.name}
                    isPrivate={item.kind === 'privateTags'}
                    onRemove={() => toggleFilterSelection(item.kind, item.id)}
                />
            {/if}
        {/each}
    </div>
{/if}
