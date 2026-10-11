import {describe, expect, it} from 'vitest';
import {extractHostname} from './url';

describe('extractHostname', () => {
    it('drops the www prefix', () => {
        expect(extractHostname('https://www.pastvu.com/p/123')).toBe('pastvu.com');
    });

    it('keeps other subdomains', () => {
        expect(extractHostname('https://ru.wikipedia.org/wiki/X')).toBe('ru.wikipedia.org');
    });

    it('returns null for text that is not a URL', () => {
        expect(extractHostname('книга, стр. 12')).toBeNull();
    });
});
