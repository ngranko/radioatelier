import {describe, expect, it} from 'vitest';
import {getAdjacentResultIndex, readArrowStep} from './resultFocus';

describe('getAdjacentResultIndex', () => {
    it('enters the list from the end the key points at', () => {
        expect(getAdjacentResultIndex(-1, 1, 3)).toBe(0);
        expect(getAdjacentResultIndex(-1, -1, 3)).toBe(2);
    });

    it('steps through the list', () => {
        expect(getAdjacentResultIndex(0, 1, 3)).toBe(1);
        expect(getAdjacentResultIndex(2, -1, 3)).toBe(1);
    });

    it('wraps around both ends', () => {
        expect(getAdjacentResultIndex(2, 1, 3)).toBe(0);
        expect(getAdjacentResultIndex(0, -1, 3)).toBe(2);
    });

    it('reports no target for an empty list', () => {
        expect(getAdjacentResultIndex(-1, 1, 0)).toBe(-1);
    });
});

describe('readArrowStep', () => {
    it('walks the list down and up', () => {
        expect(readArrowStep('ArrowDown')).toBe(1);
        expect(readArrowStep('ArrowUp')).toBe(-1);
    });

    it('leaves every other key alone', () => {
        expect(readArrowStep('Enter')).toBe(0);
        expect(readArrowStep('a')).toBe(0);
    });
});
