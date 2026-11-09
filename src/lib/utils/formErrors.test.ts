import {describe, expect, it} from 'vitest';
import {describeValidationFailure} from './formErrors';

describe('describeValidationFailure', () => {
    it('reads nested error groups and skips fields with none of their own', () => {
        expect(
            describeValidationFailure({
                tags: {0: ['bad tag']},
                source: {_errors: ['Слишком длинная ссылка']},
            }),
        ).toBe('Слишком длинная ссылка');
    });
});
