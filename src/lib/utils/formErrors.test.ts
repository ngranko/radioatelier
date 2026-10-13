import {describe, expect, it} from 'vitest';
import {describeValidationFailure} from './formErrors';

describe('describeValidationFailure', () => {
    it('names the first failing field', () => {
        expect(
            describeValidationFailure({
                name: ['Пожалуйста, введите название'],
                category: ['Нужно выбрать категорию'],
            }),
        ).toBe('Пожалуйста, введите название');
    });

    it('reads nested error groups and skips fields with none of their own', () => {
        expect(
            describeValidationFailure({
                tags: {0: ['bad tag']},
                source: {_errors: ['Слишком длинная ссылка']},
            }),
        ).toBe('Слишком длинная ссылка');
    });

    it('falls back when there is nothing to name', () => {
        expect(describeValidationFailure(undefined)).toBe('Что-то не так во введенных данных');
        expect(describeValidationFailure({})).toBe('Что-то не так во введенных данных');
    });
});
