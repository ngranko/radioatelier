export type TaxonomyType = 'category' | 'tag' | 'privateTag';

export type TaxonomyRowMode = 'view' | 'rename' | 'remove';

export interface TaxonomyEntry {
    id: string;
    name: string;
    usageCount: number;
    isDeleting?: boolean;
}

// Carried as `ConvexError` data so the client can translate failures without
// matching on server wording.
export type TaxonomyErrorCode =
    | 'nameRequired'
    | 'nameTaken'
    | 'notFound'
    | 'categoryInUse'
    | 'selfReplacement'
    | 'deletionInProgress'
    | 'migrationInProgress';
