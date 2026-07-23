import type {NotionPageFields} from '../notion/types';
import type {AppSyncFields, AppSyncPatch} from './types';

type AppMatchResult =
    | {kind: 'already_linked'; pageId: string}
    | {kind: 'matched_by_link'; pageId: string}
    | {kind: 'matched_by_heuristic'; pageId: string}
    | {kind: 'ambiguous'; pageIds: string[]}
    | {kind: 'no_match'};

const heuristicFieldNames = ['categoryName', 'address', 'city', 'country'] as const;
const syncFieldNames = [
    'name',
    'categoryName',
    'address',
    'city',
    'country',
    'mapLink',
    'internalId',
    'installedPeriod',
    'isRemoved',
    'removalPeriod',
    'tagNames',
    'isVisited',
    'source',
] as const;

export function extractObjectIdFromMapLink(value: string | null) {
    if (!value) {
        return null;
    }
    try {
        const {pathname} = new URL(value);
        const match = pathname.match(/^\/object\/([^/]+)$/);
        return match?.[1] ?? null;
    } catch {
        return null;
    }
}

// Echo suppression compares a hash written from Object Sync Fields (outbound)
// against one computed from Notion page fields (inbound), so the hash must
// not depend on either constructor's key order: serialize in syncFieldNames
// order instead.
export function computeSyncHash(fields: AppSyncFields | NotionPageFields) {
    const canonical: Record<string, unknown> = {};
    for (const fieldName of syncFieldNames) {
        canonical[fieldName] =
            fieldName === 'tagNames' ? normalizeList(fields.tagNames) : fields[fieldName];
    }
    return JSON.stringify(canonical);
}

export function findMatchForAppObject(
    objectId: string,
    appObject: AppSyncFields,
    notionPages: Array<{id: string; fields: NotionPageFields}>,
    linkedPageId: string | null,
) {
    if (linkedPageId) {
        return {kind: 'already_linked', pageId: linkedPageId} satisfies AppMatchResult;
    }

    const byLink = notionPages.find(
        page => extractObjectIdFromMapLink(page.fields.mapLink) === objectId,
    );
    if (byLink) {
        return {kind: 'matched_by_link', pageId: byLink.id} satisfies AppMatchResult;
    }

    const candidates = notionPages
        .filter(page => isHeuristicMatch(appObject, page.fields))
        .map(page => page.id);
    if (candidates.length === 1) {
        return {kind: 'matched_by_heuristic', pageId: candidates[0]} satisfies AppMatchResult;
    }
    if (candidates.length > 1) {
        return {kind: 'ambiguous', pageIds: candidates} satisfies AppMatchResult;
    }
    return {kind: 'no_match'} satisfies AppMatchResult;
}

export function computeAppToNotionDiff(appFields: AppSyncFields, notionFields: NotionPageFields) {
    return computeDifferences(appFields, notionFields, 'app');
}

export function computeNotionToAppDiff(appFields: AppSyncFields, notionFields: NotionPageFields) {
    return computeDifferences(appFields, notionFields, 'notion');
}

export function computeFieldDiscrepancies(
    appFields: AppSyncFields,
    notionFields: NotionPageFields,
) {
    const {appPatch} = computeNotionToAppDiff(appFields, notionFields);
    const {notionPatch} = computeAppToNotionDiff(appFields, notionFields);
    const differingFields = [
        ...new Set([...Object.keys(appPatch), ...Object.keys(notionPatch)]),
    ].sort();
    return {
        differingFields,
        inSync: differingFields.length === 0,
    };
}

function computeDifferences(
    appFields: AppSyncFields,
    notionFields: NotionPageFields,
    source: 'app' | 'notion',
) {
    const appPatch: AppSyncPatch = {};
    const notionPatch: Partial<NotionPageFields> = {};

    for (const fieldName of syncFieldNames) {
        const appValue = appFields[fieldName];
        const notionValue = notionFields[fieldName];
        if (fieldName === 'mapLink' || fieldName === 'internalId') {
            if (source === 'app' && normalizeText(appValue) !== normalizeText(notionValue)) {
                notionPatch[fieldName] = appValue as never;
            }
            continue;
        }
        if (fieldName === 'tagNames') {
            if (
                normalizeList(appValue as string[]).join('|') ===
                normalizeList(notionValue as string[]).join('|')
            ) {
                continue;
            }
            if (source === 'app') {
                notionPatch[fieldName] = [...(appValue as string[])];
            } else {
                appPatch[fieldName] = [...(notionValue as string[])];
            }
            continue;
        }
        if (fieldName === 'isRemoved' || fieldName === 'isVisited') {
            if (appValue === notionValue) {
                continue;
            }
            if (source === 'app') {
                notionPatch[fieldName] = appValue as never;
            } else {
                appPatch[fieldName] = notionValue as never;
            }
            continue;
        }
        if (normalizeText(appValue) === normalizeText(notionValue)) {
            continue;
        }
        if (source === 'app') {
            notionPatch[fieldName] = appValue as never;
        } else {
            appPatch[fieldName] = notionValue as never;
        }
    }

    return {appPatch, notionPatch};
}

function isHeuristicMatch(appFields: AppSyncFields, notionFields: NotionPageFields) {
    if (normalizeText(appFields.name) !== normalizeText(notionFields.name)) {
        return false;
    }

    let sharedFieldCount = 0;
    for (const fieldName of heuristicFieldNames) {
        const appValue = normalizeText(appFields[fieldName]);
        const notionValue = normalizeText(notionFields[fieldName]);
        if (!appValue || !notionValue) {
            continue;
        }
        sharedFieldCount += 1;
        if (appValue !== notionValue) {
            return false;
        }
    }

    return sharedFieldCount > 0;
}

function normalizeText(value: unknown) {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeList(values: string[]) {
    return [...new Set(values.map(item => normalizeText(item)).filter(Boolean))].sort();
}
