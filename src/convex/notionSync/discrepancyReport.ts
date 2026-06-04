import {internal} from '../_generated/api';
import {action} from '../_generated/server';
import {queryAllDataSourcePages, retrieveDataSource} from '../notion/client';
import {belongsToConfiguredDataSource, getNotionDataSourceId} from '../notion/config';
import {readNotionPageFields} from '../notion/fields';
import type {Discrepancy, EligibleOwnerPage, NotionPageSnapshot} from './discrepancyReportTypes';
import {computeFieldDiscrepancies, computeSyncHash, findMatchForAppObject} from './reconcile';
import type {ObjectSyncSnapshot, ObjectSyncSnapshotPage} from './snapshot';

const ELIGIBLE_OWNER_PAGE_SIZE = 50;
const OBJECT_SNAPSHOT_PAGE_SIZE = 200;

export const reportDiscrepancies = action({
    args: {},
    handler: async ctx => {
        const dataSource = await retrieveDataSource(getNotionDataSourceId());
        const notionPages = (await queryAllDataSourcePages(dataSource.id))
            .filter(belongsToConfiguredDataSource)
            .map(page => ({
                pageId: page.id,
                fields: readNotionPageFields(page),
            }));
        const notionPageIds = new Set(notionPages.map(page => page.pageId));
        const matchedPageIds = new Set<string>();
        const discrepancies: Discrepancy[] = [];

        let ownerCursor: string | null = null;
        let hasMoreOwners = true;
        while (hasMoreOwners) {
            const ownerPage = (await ctx.runQuery(
                internal.notionSync.snapshot.listEligibleOwnerPage,
                {
                    paginationOpts: {numItems: ELIGIBLE_OWNER_PAGE_SIZE, cursor: ownerCursor},
                },
            )) as EligibleOwnerPage;

            for (const owner of ownerPage.page) {
                let objectCursor: string | null = null;
                let hasMoreObjects = true;
                while (hasMoreObjects) {
                    const snapshotPage = (await ctx.runQuery(
                        internal.notionSync.snapshot.listEligibleObjectSnapshotPage,
                        {
                            ownerId: owner._id,
                            paginationOpts: {
                                numItems: OBJECT_SNAPSHOT_PAGE_SIZE,
                                cursor: objectCursor,
                            },
                        },
                    )) as ObjectSyncSnapshotPage;

                    for (const appObject of snapshotPage.page) {
                        collectAppObjectDiscrepancies(
                            appObject,
                            notionPages,
                            notionPageIds,
                            matchedPageIds,
                            discrepancies,
                        );
                    }
                    objectCursor = snapshotPage.continueCursor;
                    hasMoreObjects = !snapshotPage.isDone;
                }
            }
            ownerCursor = ownerPage.continueCursor;
            hasMoreOwners = !ownerPage.isDone;
        }

        for (const notionPage of notionPages) {
            if (!matchedPageIds.has(notionPage.pageId)) {
                discrepancies.push({
                    kind: 'unmatched_notion_page',
                    notionPageId: notionPage.pageId,
                    name: notionPage.fields.name ?? '',
                });
            }
        }

        const summary = summarizeDiscrepancies(discrepancies);
        console.log(`[Notion sync audit] ${formatSummary(summary)}`);
        for (const item of discrepancies) {
            console.log(`[Notion sync audit] ${formatDiscrepancy(item)}`);
        }

        return {summary, discrepancies};
    },
});

function collectAppObjectDiscrepancies(
    appObject: ObjectSyncSnapshot,
    notionPages: NotionPageSnapshot[],
    notionPageIds: Set<string>,
    matchedPageIds: Set<string>,
    discrepancies: Discrepancy[],
) {
    const linkedPageId = appObject.sync?.notionPageId ?? null;
    const linkedPageExists = linkedPageId ? notionPageIds.has(linkedPageId) : false;
    const match = findMatchForAppObject(
        appObject.objectId,
        appObject.fields,
        notionPages
            .filter(page => linkedPageExists || !matchedPageIds.has(page.pageId))
            .map(page => ({id: page.pageId, fields: page.fields})),
        linkedPageExists ? linkedPageId : null,
    );

    if (match.kind === 'ambiguous') {
        discrepancies.push({
            kind: 'ambiguous_match',
            objectId: appObject.objectId,
            name: appObject.fields.name,
            pageIds: match.pageIds,
        });
        return;
    }

    if (match.kind === 'no_match') {
        discrepancies.push({
            kind: 'unmatched_app_object',
            objectId: appObject.objectId,
            name: appObject.fields.name,
            syncNotionPageId: linkedPageId,
        });
        return;
    }

    const notionPage = notionPages.find(page => page.pageId === match.pageId);
    if (!notionPage) {
        discrepancies.push({
            kind: 'missing_notion_page',
            objectId: appObject.objectId,
            name: appObject.fields.name,
            notionPageId: match.pageId,
        });
        return;
    }

    matchedPageIds.add(match.pageId);

    if (linkedPageId && linkedPageId !== match.pageId) {
        discrepancies.push({
            kind: 'link_mismatch',
            objectId: appObject.objectId,
            name: appObject.fields.name,
            syncNotionPageId: linkedPageId,
            matchedPageId: match.pageId,
            matchKind: match.kind,
        });
    }

    if (!appObject.sync) {
        discrepancies.push({
            kind: 'missing_sync_record',
            objectId: appObject.objectId,
            notionPageId: match.pageId,
            name: appObject.fields.name,
            matchKind: match.kind,
        });
    } else {
        const expectedHash = computeSyncHash(appObject.fields);
        if (appObject.sync.lastOutboundHash !== expectedHash) {
            discrepancies.push({
                kind: 'stale_outbound_hash',
                objectId: appObject.objectId,
                notionPageId: match.pageId,
                name: appObject.fields.name,
                storedHash: appObject.sync.lastOutboundHash,
                expectedHash,
            });
        }
    }

    const {differingFields, inSync} = computeFieldDiscrepancies(
        appObject.fields,
        notionPage.fields,
    );
    if (!inSync) {
        discrepancies.push({
            kind: 'field_mismatch',
            objectId: appObject.objectId,
            notionPageId: match.pageId,
            name: appObject.fields.name,
            differingFields,
        });
    }
}

function summarizeDiscrepancies(discrepancies: Discrepancy[]) {
    const counts: Record<Discrepancy['kind'], number> = {
        ambiguous_match: 0,
        unmatched_app_object: 0,
        missing_notion_page: 0,
        link_mismatch: 0,
        field_mismatch: 0,
        missing_sync_record: 0,
        stale_outbound_hash: 0,
        unmatched_notion_page: 0,
    };
    for (const item of discrepancies) {
        counts[item.kind] += 1;
    }
    return {
        total: discrepancies.length,
        ...counts,
        inSync: discrepancies.length === 0,
    };
}

function formatSummary(summary: ReturnType<typeof summarizeDiscrepancies>) {
    if (summary.inSync) {
        return 'inSync=true';
    }
    return [
        `inSync=false total=${summary.total}`,
        `ambiguous=${summary.ambiguous_match}`,
        `unmatchedApp=${summary.unmatched_app_object}`,
        `missingNotionPage=${summary.missing_notion_page}`,
        `linkMismatch=${summary.link_mismatch}`,
        `fieldMismatch=${summary.field_mismatch}`,
        `missingSync=${summary.missing_sync_record}`,
        `staleHash=${summary.stale_outbound_hash}`,
        `unmatchedNotion=${summary.unmatched_notion_page}`,
    ].join(' ');
}

function formatDiscrepancy(item: Discrepancy) {
    switch (item.kind) {
        case 'ambiguous_match':
            return `ambiguous object=${item.objectId} name=${item.name} pages=${item.pageIds.join(',')}`;
        case 'unmatched_app_object':
            return `unmatched-app object=${item.objectId} name=${item.name} syncPage=${item.syncNotionPageId ?? 'none'}`;
        case 'missing_notion_page':
            return `missing-notion-page object=${item.objectId} page=${item.notionPageId}`;
        case 'link_mismatch':
            return `link-mismatch object=${item.objectId} syncPage=${item.syncNotionPageId} matched=${item.matchedPageId}`;
        case 'field_mismatch':
            return `field-mismatch object=${item.objectId} page=${item.notionPageId} fields=${item.differingFields.join(',') || 'none'}`;
        case 'missing_sync_record':
            return `missing-sync object=${item.objectId} page=${item.notionPageId}`;
        case 'stale_outbound_hash':
            return `stale-hash object=${item.objectId} page=${item.notionPageId}`;
        case 'unmatched_notion_page':
            return `unmatched-notion page=${item.notionPageId} name=${item.name}`;
    }
}
