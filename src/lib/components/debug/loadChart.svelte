<script lang="ts">
    import {downsample, polylineFor} from '$lib/services/debug/chartPath';
    import type {LoadSample} from '$lib/services/debug/loadSampler';

    interface Props {
        label: string;
        unit: string;
        samples: LoadSample[];
        read: (sample: LoadSample) => number | undefined;
        emptyHint: string;
    }

    let {label, unit, samples, read, emptyHint}: Props = $props();

    const width = 240;
    const height = 72;
    const points = $derived(polylineFor(downsample(samples), read, width, height));
</script>

<div>
    <div class="mb-1 flex items-baseline justify-between gap-2">
        <span class="text-muted-foreground text-xs">{label}</span>
        <span class="text-muted-foreground/70 text-[10px]">{unit}</span>
    </div>
    {#if points}
        <svg
            viewBox="0 0 {width} {height}"
            class="text-primary w-full"
            role="img"
            aria-label={label}
        >
            <polyline
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
                stroke-linecap="round"
                {points}
            />
        </svg>
    {:else}
        <p class="text-muted-foreground/70 py-4 text-center text-xs">{emptyHint}</p>
    {/if}
</div>
