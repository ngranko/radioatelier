import {STATUS_UNAUTHORIZED} from '$lib/api/constants';
import type Request from '$lib/api/request/Request';
import {refreshToken} from '$lib/api/token';
import RequestError from '$lib/errors/RequestError';
import RefreshToken from '$lib/api/auth/refreshToken';

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
        await navigator.locks.request('refresh_token', async () => {
            const response = await refreshToken(RefreshToken.get() ?? '');
            RefreshToken.set(response.data.refreshToken);
        });
        return this.request.send();
    }
}
