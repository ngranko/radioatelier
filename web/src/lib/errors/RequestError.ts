import BaseError from '$lib/errors/BaseError';
import {
    STATUS_FORBIDDEN,
    STATUS_UNAUTHORIZED,
    STATUS_UNPROCESSABLE_ENTITY,
} from '$lib/api/constants';

export default class RequestError extends BaseError {
    public status: number;
    public payload: unknown;

    public constructor(message: string, status: number, payload: unknown = undefined) {
        super(message);
        this.name = 'RequestError';
        this.status = status;
        this.payload = payload;
    }

    public isAuthorizationError(): boolean {
        return this.status === STATUS_UNAUTHORIZED;
    }

    public isUserUnverifiedError(): boolean {
        return this.status === STATUS_FORBIDDEN;
    }

    public isValidationError(): boolean {
        return this.status === STATUS_UNPROCESSABLE_ENTITY;
    }
}
