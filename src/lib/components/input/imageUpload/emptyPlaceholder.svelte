<script lang="ts">
    import type {Id} from '$convex/_generated/dataModel';
    import LogoMark from '$lib/components/branding/logoMark.svelte';
    import {markerIconMap} from '$lib/services/map/markerStyling';
    import {categoriesState} from '$lib/state/categories.svelte';
    import {cn} from '$lib/utils.ts';

    interface Props {
        categoryId?: Id<'categories'> | null;
        class?: string;
    }

    let {categoryId = null, class: className}: Props = $props();

    const category = $derived(categoryId ? categoriesState.categories[categoryId] : undefined);
    const icon = $derived(category ? markerIconMap[category.markerIcon] : undefined);
</script>

<div
    class={cn(
        'bg-muted relative flex aspect-2/1 w-full items-center justify-center overflow-hidden',
        className,
    )}
    style:background-color={category
        ? `color-mix(in oklch, ${category.markerColor} 14%, var(--muted))`
        : undefined}
>
    {#if category && icon}
        <!-- mixed toward --muted rather than faded with opacity, so the black category
             still reads against the dark theme -->
        <icon.component
            class={cn(icon.className, 'size-20')}
            style="color: color-mix(in oklch, {category.markerColor} 45%, var(--muted))"
            aria-hidden="true"
        />
    {:else}
        <div class="text-foreground/70 dark:text-foreground/80">
            <LogoMark class="h-12" />
        </div>
    {/if}
</div>
