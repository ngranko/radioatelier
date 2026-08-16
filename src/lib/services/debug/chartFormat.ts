const CPU_LABELS = ['штатная', 'заметная', 'высокая', 'критическая'] as const;

export function formatMs(value: number): string {
    if (value >= 100) {
        return String(Math.round(value));
    }
    return trimDecimal(value.toFixed(1));
}

export function formatFps(frameMs: number): string {
    if (frameMs <= 0) {
        return '—';
    }
    return `${Math.round(1000 / frameMs)} FPS`;
}

export function formatMb(value: number): string {
    if (value >= 10) {
        return String(Math.round(value));
    }
    return trimDecimal(value.toFixed(1));
}

export function formatDuration(ms: number): string {
    if (ms >= 1000) {
        return `${trimDecimal((ms / 1000).toFixed(1))} с`;
    }
    return `${Math.round(ms)} мс`;
}

export function formatCpu(value: number): string {
    return CPU_LABELS[clampCpuIndex(value)];
}

export function formatAxisNumber(value: number): string {
    return trimDecimal(value.toFixed(1));
}

function clampCpuIndex(value: number): number {
    return Math.min(CPU_LABELS.length - 1, Math.max(0, Math.round(value)));
}

function trimDecimal(value: string): string {
    return value.replace(/\.0$/, '');
}
