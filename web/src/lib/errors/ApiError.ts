import {STATUS_REQUEST_ERROR} from '$lib/api/constants';
import BaseError from '$lib/errors/BaseError';

interface ApiErrorPayload {
    [key: string]: string;
}

export default class ApiError extends BaseError {
    public readonly payload: ApiErrorPayload;
    public readonly status: number;
    public readonly endpoint: string;

    public constructor(message = '', payload = {}, status = STATUS_REQUEST_ERROR, endpoint = '') {
        super(message);
        this.name = 'ApiError';
        this.payload = payload;
        this.status = status;
        this.endpoint = endpoint;
    }
}
