import {describe, expect, it} from 'vitest';
import {
    formatAxisNumber,
    formatCpu,
    formatDuration,
    formatFps,
    formatMb,
    formatMs,
} from './chartFormat';

describe('chartFormat', () => {
    it('formats frame times and fps', () => {
        expect(formatMs(8.2)).toBe('8.2');
        expect(formatMs(16.0)).toBe('16');
        expect(formatMs(140.4)).toBe('140');
        expect(formatFps(16.7)).toBe('60 FPS');
    });

    it('formats duration, memory, cpu, and axis ticks', () => {
        expect(formatDuration(240)).toBe('240 мс');
        expect(formatDuration(1500)).toBe('1.5 с');
        expect(formatMb(8.25)).toBe('8.3');
        expect(formatMb(24.1)).toBe('24');
        expect(formatCpu(0.2)).toBe('штатная');
        expect(formatCpu(3)).toBe('критическая');
        expect(formatAxisNumber(1.5)).toBe('1.5');
        expect(formatAxisNumber(3)).toBe('3');
    });
});
