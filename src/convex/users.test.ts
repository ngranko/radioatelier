import {describe, expect, it} from 'vitest';
import {isAdminUser} from './users';

describe('isAdminUser', () => {
    it('accepts an active admin', () => {
        expect(isAdminUser({role: 'admin', isDeleted: false})).toBe(true);
    });

    it('rejects everyone else', () => {
        expect(isAdminUser({role: 'admin', isDeleted: true})).toBe(false);
        expect(isAdminUser({role: 'user', isDeleted: false})).toBe(false);
        expect(isAdminUser(null)).toBe(false);
    });
});
