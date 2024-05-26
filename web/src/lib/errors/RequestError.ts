import BaseError from '$lib/errors/BaseError';
import type KeyVal from '$lib/interfaces/keyVal';
import {STATUS_FORBIDDEN, STATUS_UNAUTHORIZED, STATUS_UNPROCESSABLE_ENTITY} from '$lib/api/constants';

export default class RequestError extends BaseError {
    public status: number;
    public payload: KeyVal | undefined;

    public constructor(message: string, status: number, payload: KeyVal | undefined = undefined) {
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
