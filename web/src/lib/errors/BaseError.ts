export default class BaseError extends Error {
    public constructor(message = '') {
        super(message);
        this.name = 'BaseError';
    }
}
