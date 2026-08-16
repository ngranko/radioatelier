<script lang="ts">
    import {formatDuration} from '$lib/services/debug/chartFormat';
    import {buildChart, CHART_HEIGHT, CHART_WIDTH} from '$lib/services/debug/chartPath';
    import type {LoadSample} from '$lib/services/debug/loadSampler';

    interface Props {
        label: string;
        unit: string;
        samples: LoadSample[];
        read: (sample: LoadSample) => number | undefined;
        emptyHint: string;
        formatValue?: (value: number) => string;
        formatAxis?: (value: number) => string;
        formatDetail?: (value: number) => string;
        yMin?: number;
        yMax?: number;
        reference?: {value: number; label: string};
        legend?: string[];
    }

    let {
        label,
        unit,
        samples,
        read,
        emptyHint,
        formatValue = String,
        formatAxis,
        formatDetail,
        yMin = 0,
        yMax,
        reference,
        legend = [],
    }: Props = $props();

    const chart = $derived(buildChart(samples, read, {yMin, yMax, reference: reference?.value}));
    const mid = $derived(chart ? (chart.yMin + chart.yMax) / 2 : 0);
    const axisLabel = $derived(formatAxis ?? formatValue);
</script>

<div>
    <div class="mb-1 flex items-baseline justify-between gap-2">
        <span class="text-muted-foreground text-xs">{label}</span>
        <span class="text-muted-foreground/70 text-[10px]">{unit}</span>
    </div>
    {#if chart}
        <p class="text-muted-foreground mb-1 text-[11px] leading-snug">
            мин {formatValue(chart.min)} · сред {formatValue(chart.avg)}{formatDetail
                ? ` (${formatDetail(chart.avg)})`
                : ''} · макс {formatValue(chart.max)}{formatDetail
                ? ` (${formatDetail(chart.max)})`
                : ''}
        </p>
        <div class="flex gap-1.5">
            <div
                class="text-muted-foreground/80 flex h-[72px] w-10 shrink-0 flex-col justify-between pt-0.5 pb-0.5 text-right text-[10px] leading-none"
            >
                <span>{axisLabel(chart.yMax)}</span>
                <span>{axisLabel(mid)}</span>
                <span>{axisLabel(chart.yMin)}</span>
            </div>
            <div class="min-w-0 grow">
                <svg
                    viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}"
                    class="text-primary w-full"
                    role="img"
                    aria-label={label}
                >
                    {#if chart.refY !== null}
                        <line
                            x1="4"
                            x2={CHART_WIDTH - 4}
                            y1={chart.refY}
                            y2={chart.refY}
                            class="text-muted-foreground"
                            stroke="currentColor"
                            stroke-width="1"
                            stroke-dasharray="4 3"
                        />
                    {/if}
                    <polyline
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linejoin="round"
                        stroke-linecap="round"
                        points={chart.polyline}
                    />
                </svg>
                <div class="text-muted-foreground/80 mt-0.5 flex justify-between text-[10px]">
                    <span>0</span>
                    <span>{formatDuration(chart.durationMs)}</span>
                </div>
            </div>
        </div>
        {#if reference || legend.length > 0}
            <ul class="text-muted-foreground mt-1.5 space-y-0.5 text-[11px] leading-snug">
                {#if reference}
                    <li>Пунктир — {reference.label}</li>
                {/if}
                {#each legend as item}
                    <li>{item}</li>
                {/each}
            </ul>
        {/if}
    {:else}
        <p class="text-muted-foreground/70 py-4 text-center text-xs">{emptyHint}</p>
    {/if}
</div>
