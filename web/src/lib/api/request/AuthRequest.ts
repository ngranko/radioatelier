import {STATUS_UNAUTHORIZED} from '$lib/api/constants';
import type Request from '$lib/api/request/Request';
import {refreshToken} from '$lib/api/token';
import RequestError from '$lib/errors/RequestError';

let refreshPromise: Promise<void> | null = null;

const withRefreshLock = async (fn: () => Promise<void>): Promise<void> => {
    if (typeof navigator !== 'undefined' && typeof navigator.locks !== 'undefined') {
        await navigator.locks.request('refresh_token', fn);
        return;
    }

    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                await fn();
            } finally {
                refreshPromise = null;
            }
        })();
    }

    await refreshPromise;
};

export default class AuthRequest<T = never> {
    private readonly request: Request<T>;

    public constructor(request: Request<T>) {
        this.request = request;
    }

    public async send(): Promise<T> {
        try {
            return await this.request.send();
        } catch (error) {
            if (error instanceof RequestError && error.status === STATUS_UNAUTHORIZED) {
                return this.refreshTokenAndRestart();
            }

            throw error;
        }
    }

    private async refreshTokenAndRestart(): Promise<T> {
        await withRefreshLock(async () => {
            await refreshToken(this.request.getOptions());
        });
        return this.request.send();
    }
}
