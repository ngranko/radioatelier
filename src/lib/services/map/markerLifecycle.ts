const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_QUIET_MS = 48;

export class MarkerLifecycle {
    private pending = 0;
    private waiters: Array<() => void> = [];

    public begin(): void {
        this.pending++;
    }

    public end(): void {
        this.pending = Math.max(0, this.pending - 1);
        if (this.pending === 0) {
            this.flushWaiters();
        }
    }

    public reset(): void {
        this.pending = 0;
        this.flushWaiters();
    }

    public get isIdle(): boolean {
        return this.pending === 0;
    }

    public onNextIdle(callback: () => void): void {
        if (this.pending === 0) {
            callback();
            return;
        }
        this.waiters.push(callback);
    }

    public waitUntilIdle(options?: {timeoutMs?: number; quietMs?: number}): Promise<void> {
        return waitUntilIdle(this, options);
    }

    private flushWaiters(): void {
        const waiters = this.waiters.splice(0);
        for (const waiter of waiters) {
            waiter();
        }
    }
}

export const markerLifecycle = new MarkerLifecycle();

async function waitUntilIdle(
    lifecycle: MarkerLifecycle,
    options?: {timeoutMs?: number; quietMs?: number},
): Promise<void> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const quietMs = options?.quietMs ?? DEFAULT_QUIET_MS;
    const deadline = performance.now() + timeoutMs;

    while (performance.now() < deadline) {
        if (!lifecycle.isIdle) {
            await waitForIdleSignal(lifecycle, deadline);
            continue;
        }
        await sleep(quietMs);
        if (lifecycle.isIdle) {
            return;
        }
    }

    throw new Error('Timed out waiting for marker pipeline');
}

function waitForIdleSignal(lifecycle: MarkerLifecycle, deadline: number): Promise<void> {
    const remaining = deadline - performance.now();
    return new Promise((resolve, reject) => {
        if (remaining <= 0) {
            reject(new Error('Timed out waiting for marker pipeline'));
            return;
        }
        const timer = setTimeout(() => {
            reject(new Error('Timed out waiting for marker pipeline'));
        }, remaining);
        lifecycle.onNextIdle(() => {
            clearTimeout(timer);
            resolve();
        });
    });
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
