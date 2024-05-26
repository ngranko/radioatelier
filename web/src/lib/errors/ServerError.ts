import BaseError from '$lib/errors/BaseError';

export default class ServerError extends BaseError {
    public constructor(message: string) {
        super(message);
        this.name = 'ServerError';
    }
}
