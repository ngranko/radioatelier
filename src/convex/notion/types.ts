export type NotionPropertySchema = {
    id?: string;
    name?: string;
    type?: string;
};

export type NotionDataSource = {
    id: string;
    properties: Record<string, NotionPropertySchema>;
};

export type NotionPage = {
    id: string;
    last_edited_time?: string;
    in_trash?: boolean;
    archived?: boolean;
    is_archived?: boolean;
    created_by?: {
        id?: string;
    };
    last_edited_by?: {
        id?: string;
    };
    parent?: {
        type?: string;
        data_source_id?: string;
    };
    properties?: Record<string, unknown>;
};

export type NotionPageFields = {
    name: string | null;
    categoryName: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    mapLink: string | null;
    internalId: string | null;
    installedPeriod: string | null;
    isRemoved: boolean;
    removalPeriod: string | null;
    tagNames: string[];
    isVisited: boolean;
    source: string | null;
};

export type MatchResult =
    | {kind: 'already_linked'; pageId: string}
    | {kind: 'matched_by_link'; pageId: string}
    | {kind: 'matched_by_heuristic'; pageId: string}
    | {kind: 'ambiguous'; pageIds: string[]}
    | {kind: 'no_match'};
