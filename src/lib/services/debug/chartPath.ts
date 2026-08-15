import type {LoadSample} from './loadSampler';

const MAX_CHART_POINTS = 80;

export function downsample<T>(items: T[], maxPoints = MAX_CHART_POINTS): T[] {
    if (items.length <= maxPoints) {
        return items;
    }

    const step = (items.length - 1) / (maxPoints - 1);
    return Array.from({length: maxPoints}, (_, index) => items[Math.round(index * step)]);
}

export function polylineFor(
    samples: LoadSample[],
    read: (sample: LoadSample) => number | undefined,
    width: number,
    height: number,
): string | null {
    const points = numberedValues(samples, read);
    if (points.length < 2) {
        return null;
    }
    return toPolyline(points, samples.length - 1, width, height);
}

function numberedValues(
    samples: LoadSample[],
    read: (sample: LoadSample) => number | undefined,
): Array<{index: number; value: number}> {
    const points: Array<{index: number; value: number}> = [];
    for (const [index, sample] of samples.entries()) {
        const value = read(sample);
        if (value !== undefined) {
            points.push({index, value});
        }
    }
    return points;
}

function toPolyline(
    points: Array<{index: number; value: number}>,
    maxIndex: number,
    width: number,
    height: number,
): string {
    const padding = 4;
    const values = points.map(point => point.value);
    const minY = Math.min(...values);
    const spanY = Math.max(...values) - minY || 1;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    return points
        .map(({index, value}) => {
            const x = padding + (index / (maxIndex || 1)) * innerW;
            const y = padding + innerH - ((value - minY) / spanY) * innerH;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
}
