import type {LoadSample} from './loadSampler';

const MAX_CHART_POINTS = 80;
export const CHART_WIDTH = 240;
export const CHART_HEIGHT = 72;
const PAD = 4;

export interface ChartModel {
    polyline: string;
    min: number;
    max: number;
    avg: number;
    durationMs: number;
    yMin: number;
    yMax: number;
    refY: number | null;
}

export function downsample<T>(items: T[], maxPoints = MAX_CHART_POINTS): T[] {
    if (maxPoints <= 0) {
        return [];
    }
    if (maxPoints === 1) {
        return items.slice(0, 1);
    }
    if (items.length <= maxPoints) {
        return items;
    }

    const step = (items.length - 1) / (maxPoints - 1);
    return Array.from({length: maxPoints}, (_, index) => items[Math.round(index * step)]);
}

export function buildChart(
    samples: LoadSample[],
    read: (sample: LoadSample) => number | undefined,
    options: {yMin?: number; yMax?: number; reference?: number} = {},
): ChartModel | null {
    const points = collectPoints(downsample(samples), read);
    if (points.length < 2) {
        return null;
    }

    const stats = summarize(points);
    const yMin = options.yMin ?? 0;
    const yMax = chartMax(stats.max, yMin, options.yMax, options.reference);
    return {
        ...stats,
        yMin,
        yMax,
        polyline: toPolyline(points, yMin, yMax),
        refY: referenceY(options.reference, yMin, yMax),
    };
}

function collectPoints(
    samples: LoadSample[],
    read: (sample: LoadSample) => number | undefined,
): Array<{t: number; value: number}> {
    const points: Array<{t: number; value: number}> = [];
    for (const sample of samples) {
        const value = read(sample);
        if (value !== undefined) {
            points.push({t: sample.t, value});
        }
    }
    return points;
}

function summarize(points: Array<{t: number; value: number}>) {
    const values = points.map(point => point.value);
    return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, value) => sum + value, 0) / values.length,
        durationMs: points.at(-1)!.t - points[0].t,
    };
}

function chartMax(dataMax: number, yMin: number, forced?: number, reference?: number): number {
    const top = Math.max(dataMax, yMin, forced ?? yMin, reference ?? yMin);
    return top === yMin ? yMin + 1 : top;
}

function toPolyline(points: Array<{t: number; value: number}>, yMin: number, yMax: number): string {
    const t0 = points[0].t;
    const spanT = points.at(-1)!.t - t0 || 1;
    const spanY = yMax - yMin || 1;
    const innerW = CHART_WIDTH - PAD * 2;
    const innerH = CHART_HEIGHT - PAD * 2;
    return points
        .map(point => {
            const x = PAD + ((point.t - t0) / spanT) * innerW;
            const y = PAD + innerH - ((point.value - yMin) / spanY) * innerH;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
}

function referenceY(reference: number | undefined, yMin: number, yMax: number): number | null {
    if (reference === undefined || reference < yMin || reference > yMax) {
        return null;
    }
    const spanY = yMax - yMin || 1;
    const innerH = CHART_HEIGHT - PAD * 2;
    return PAD + innerH - ((reference - yMin) / spanY) * innerH;
}
