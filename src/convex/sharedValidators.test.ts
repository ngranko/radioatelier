import {describe, expect, it} from 'vitest';
import {LIMITS} from '../lib/utils/fieldLimits';
import {assertObjectFieldLengths} from './sharedValidators';

describe('assertObjectFieldLengths', () => {
    it('accepts values at the limit and nulls', () => {
        expect(() =>
            assertObjectFieldLengths({
                name: 'a'.repeat(LIMITS.name),
                description: null,
                installedPeriod: 'a'.repeat(LIMITS.period),
            }),
        ).not.toThrow();
    });

    it('rejects a value over the limit', () => {
        expect(() =>
            assertObjectFieldLengths({description: 'a'.repeat(LIMITS.description + 1)}),
        ).toThrow('description');
        expect(() =>
            assertObjectFieldLengths({removalPeriod: 'a'.repeat(LIMITS.period + 1)}),
        ).toThrow('removalPeriod');
    });
});
