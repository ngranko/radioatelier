export type TaxonomyType = 'category' | 'tag' | 'privateTag';

export type TaxonomyRowMode = 'view' | 'rename' | 'remove';

export interface TaxonomyEntry {
    id: string;
    name: string;
    usageCount: number;
}
