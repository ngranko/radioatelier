<script lang="ts">
    import {
        MARKER_COLOR_NAMES,
        MARKER_COLORS,
        type MarkerColor,
    } from '$lib/services/map/markerStyling.data';
    import CheckIcon from '@lucide/svelte/icons/check';

    interface Props {
        value: MarkerColor;
        onchange: (color: MarkerColor) => void;
    }

    let {value, onchange}: Props = $props();
</script>

<div
    class="flex flex-wrap gap-1.5 max-sm:pointer-coarse:grid max-sm:pointer-coarse:grid-cols-9 max-sm:pointer-coarse:gap-0 sm:pointer-coarse:gap-5"
>
    {#each MARKER_COLORS as color (color)}
        <button
            type="button"
            class="group relative flex items-center justify-center rounded-full max-sm:pointer-coarse:h-11 sm:pointer-coarse:after:absolute sm:pointer-coarse:after:-inset-2.5"
            onclick={() => onchange(color)}
            aria-label={MARKER_COLOR_NAMES[color]}
            aria-pressed={value === color}
        >
            <span
                class="flex size-6 items-center justify-center rounded-full transition-all duration-150 group-hover:scale-110 {value ===
                color
                    ? 'ring-foreground/40 ring-2 ring-offset-2'
                    : 'ring-1 ring-black/10 dark:ring-white/20'}"
                style:background-color={color}
            >
                {#if value === color}
                    <CheckIcon class="size-3.5 text-white drop-shadow-sm" />
                {/if}
            </span>
        </button>
    {/each}
</div>
