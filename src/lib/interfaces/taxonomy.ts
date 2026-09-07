export type TaxonomyType = 'category' | 'tag' | 'privateTag';

export interface TaxonomyEntry {
    id: string;
    name: string;
    usageCount: number;
    ownerEmail: string | null;
}
