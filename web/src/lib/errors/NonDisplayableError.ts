import BaseError from '$lib/errors/BaseError';

export default class NonDisplayableError extends BaseError {
    public readonly hiddenMessage: string;

    public constructor(message = '') {
        super('');
        this.name = 'NonDisplayableError';
        this.hiddenMessage = message;
    }

    public toString(): string {
        return `${this.name}: ${this.hiddenMessage}`;
    }
}
