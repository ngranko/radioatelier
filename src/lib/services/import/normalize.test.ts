import type {ImportMappingsForJob} from '$lib/interfaces/import';
import {describe, expect, it} from 'vitest';
import {normalizeRows} from './normalize';

const mappings: ImportMappingsForJob = {
    coordinates: 0,
    name: 1,
    category: 2,
    isVisited: null,
    isPublic: null,
    isRemoved: null,
    tags: 3,
    privateTags: 4,
    address: null,
    city: null,
    country: null,
    installedPeriod: null,
    removalPeriod: null,
    description: null,
    source: null,
    image: null,
};

describe('normalizeRows', () => {
    it('splits tags by semicolon or comma', () => {
        const [row] = normalizeRows(
            [['41.8420113,-89.4859696', 'Clock shop', 'Shop', 'trade, shop; clock', 'todo,visit']],
            mappings,
            false,
        );

        expect(row.tags).toEqual(['trade', 'shop', 'clock']);
        expect(row.privateTags).toEqual(['todo', 'visit']);
    });
});
