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

<!-- the glyph's lightness is clamped per theme so very dark or very light categories stay
     visible; the surface keeps only the category's hue at a fixed lightness, so no category turns
     the slot into a heavy slab. Mixing in oklab keeps greyscale colours from drifting purple. -->
<div
    class={cn(
        'relative flex aspect-2/1 w-full items-center justify-center overflow-hidden',
        '[--cover-l:0.9] [--cover-mix:18%] [--tint-l-max:0.55] [--tint-l-min:0.3] [--tint-mix:22%]',
        'dark:[--cover-l:0.26] dark:[--tint-l-max:0.9] dark:[--tint-l-min:0.75] dark:[--tint-mix:32%]',
        className,
    )}
    style:--tint={category
        ? `oklch(from ${category.markerColor} clamp(var(--tint-l-min), l, var(--tint-l-max)) c h)`
        : undefined}
    style:--cover-surface={category
        ? `color-mix(in oklab, oklch(from ${category.markerColor} var(--cover-l) min(c, 0.1) h) var(--cover-mix), var(--muted))`
        : 'var(--muted)'}
    style:background-color="var(--cover-surface)"
>
    {#if category && icon}
        <icon.component
            class={cn(icon.className, 'size-14')}
            style="color: color-mix(in oklab, var(--tint) var(--tint-mix), var(--cover-surface))"
            aria-hidden="true"
        />
    {:else}
        <div class="text-foreground/70 dark:text-foreground/80">
            <LogoMark class="h-12" />
        </div>
    {/if}
</div>
