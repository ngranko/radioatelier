import BaseError from '$lib/errors/BaseError';

export default class WebSocketError extends BaseError {
    public constructor(message: string) {
        super(message);
        this.name = 'WebSocketError';
    }
}
