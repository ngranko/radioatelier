import {describe, expect, it} from 'vitest';
import {decideAddressAutofill} from './addressAutofill';

describe('decideAddressAutofill', () => {
    it('ignores empty incoming values', () => {
        expect(decideAddressAutofill('', '', '', '')).toEqual({kind: 'ignore'});
        expect(decideAddressAutofill(undefined, '', '', '')).toEqual({kind: 'ignore'});
    });

    it('does not re-apply after the user clears a previously autofilled field', () => {
        expect(decideAddressAutofill('Moscow', '', 'Moscow', 'Moscow')).toEqual({
            kind: 'ignore',
        });
    });

    it('fills an empty field when geocode data first arrives', () => {
        expect(decideAddressAutofill('Moscow', '', '', '')).toEqual({
            kind: 'apply',
            incomingValue: 'Moscow',
        });
    });

    it('updates a previous autofill when geocode data changes', () => {
        expect(decideAddressAutofill('SPb', 'Moscow', 'Moscow', 'Moscow')).toEqual({
            kind: 'apply',
            incomingValue: 'SPb',
        });
    });

    it('remembers incoming values without overwriting user edits', () => {
        expect(decideAddressAutofill('Moscow', 'Custom', '', '')).toEqual({
            kind: 'remember',
            incomingValue: 'Moscow',
        });
    });

    it('remembers when the form already matches the incoming value', () => {
        expect(decideAddressAutofill('Moscow', 'Moscow', '', '')).toEqual({
            kind: 'remember',
            incomingValue: 'Moscow',
        });
    });
});
