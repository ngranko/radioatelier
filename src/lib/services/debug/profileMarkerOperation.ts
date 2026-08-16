import {markerLifecycle} from '$lib/services/map/markerLifecycle';
import {tick} from 'svelte';
import {LoadSampler, type LoadSample} from './loadSampler';

export type ProfileOperation = 'add' | 'remove';
export type ProfileRenderer = 'dom' | 'deck' | 'clustered';

export interface ProfileResult {
    operation: ProfileOperation;
    markerCount: number;
    durationMs: number;
    timedOut: boolean;
    renderer: ProfileRenderer;
    samples: LoadSample[];
}

export async function profileMarkerOperation(options: {
    operation: ProfileOperation;
    markerCount: number;
    renderer: ProfileRenderer;
    run: () => void;
}): Promise<ProfileResult> {
    const sampler = new LoadSampler();
    const startedAt = performance.now();
    sampler.start();

    try {
        options.run();
        await tick();
    } catch (error) {
        sampler.stop();
        throw error;
    }

    return await settleOrTimeout(options, sampler, startedAt);
}

async function settleOrTimeout(
    options: Pick<ProfileResult, 'operation' | 'markerCount' | 'renderer'>,
    sampler: LoadSampler,
    startedAt: number,
): Promise<ProfileResult> {
    try {
        return await finishProfile(options, sampler, startedAt, false);
    } catch (error) {
        if (isTimeout(error)) {
            return finishProfile(options, sampler, startedAt, true);
        }
        sampler.stop();
        throw error;
    }
}

async function finishProfile(
    options: Pick<ProfileResult, 'operation' | 'markerCount' | 'renderer'>,
    sampler: LoadSampler,
    startedAt: number,
    timedOut: boolean,
): Promise<ProfileResult> {
    if (!timedOut) {
        await markerLifecycle.waitUntilIdle();
    }
    const samples = sampler.stop();
    return {
        operation: options.operation,
        markerCount: options.markerCount,
        renderer: options.renderer,
        durationMs: performance.now() - startedAt,
        timedOut,
        samples,
    };
}

function isTimeout(error: unknown): boolean {
    return error instanceof Error && error.message.startsWith('Timed out');
}
