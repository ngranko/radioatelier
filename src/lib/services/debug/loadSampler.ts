export interface LoadSample {
    t: number;
    frameMs: number;
    heapUsedMb?: number;
    heapTotalMb?: number;
    cpuPressure?: number;
}

const CPU_PRESSURE: Record<string, number> = {
    nominal: 0,
    fair: 1,
    serious: 2,
    critical: 3,
};

export class LoadSampler {
    private samples: LoadSample[] = [];
    private rafId = 0;
    private startedAt = 0;
    private lastFrameAt = 0;
    private cpuPressure?: number;
    private pressureObserver?: PressureObserverLike;

    public start(): void {
        this.samples = [];
        this.startedAt = performance.now();
        this.lastFrameAt = this.startedAt;
        this.cpuPressure = undefined;
        this.observeCpuPressure();
        this.rafId = requestAnimationFrame(now => this.onFrame(now));
    }

    public stop(): LoadSample[] {
        cancelAnimationFrame(this.rafId);
        this.pressureObserver?.disconnect();
        this.pressureObserver = undefined;
        return this.samples;
    }

    private onFrame(now: number): void {
        const frameMs = now - this.lastFrameAt;
        this.lastFrameAt = now;
        this.samples.push(readSample(now - this.startedAt, frameMs, this.cpuPressure));
        this.rafId = requestAnimationFrame(next => this.onFrame(next));
    }

    private observeCpuPressure(): void {
        const Observer = getPressureObserver();
        if (!Observer) {
            return;
        }

        this.pressureObserver = new Observer(records => {
            const last = records.at(-1);
            if (last) {
                this.cpuPressure = CPU_PRESSURE[last.state] ?? 0;
            }
        });
        void this.pressureObserver.observe('cpu');
    }
}

function readSample(t: number, frameMs: number, cpuPressure?: number): LoadSample {
    const memory = readMemory();
    return {
        t,
        frameMs,
        cpuPressure,
        heapUsedMb: memory?.used,
        heapTotalMb: memory?.total,
    };
}

function readMemory(): {used: number; total: number} | undefined {
    const memory = performanceMemory();
    if (!memory) {
        return undefined;
    }
    return {
        used: memory.usedJSHeapSize / 1_048_576,
        total: memory.totalJSHeapSize / 1_048_576,
    };
}

function performanceMemory(): MemoryInfoLike | undefined {
    return 'memory' in performance ? (performance as Performance & {memory: MemoryInfoLike}).memory : undefined;
}

function getPressureObserver(): PressureObserverConstructor | undefined {
    return 'PressureObserver' in globalThis
        ? (globalThis as typeof globalThis & {PressureObserver: PressureObserverConstructor})
              .PressureObserver
        : undefined;
}

interface MemoryInfoLike {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
}

interface PressureRecordLike {
    state: string;
}

interface PressureObserverLike {
    observe(source: string): void;
    disconnect(): void;
}

type PressureObserverConstructor = new (
    callback: (records: PressureRecordLike[]) => void,
) => PressureObserverLike;
