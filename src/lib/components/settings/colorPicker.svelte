<script lang="ts">
    import {MARKER_COLORS, type MarkerColor} from '$lib/services/map/markerStyling.data';
    import CheckIcon from '@lucide/svelte/icons/check';

    interface Props {
        value: MarkerColor;
        onchange: (color: MarkerColor) => void;
    }

    let {value, onchange}: Props = $props();
</script>

<div class="flex flex-wrap gap-1.5">
    {#each MARKER_COLORS as color (color)}
        <button
            type="button"
            class="flex size-6 items-center justify-center rounded-full transition-all duration-150 hover:scale-110 {value ===
            color
                ? 'ring-foreground/40 ring-2 ring-offset-2'
                : 'ring-1 ring-black/10'}"
            style:background-color={color}
            onclick={() => onchange(color)}
            aria-label={`Выбрать цвет ${color}`}
            aria-pressed={value === color}
        >
            {#if value === color}
                <CheckIcon class="size-3.5 text-white drop-shadow-sm" />
            {/if}
        </button>
    {/each}
</div>
