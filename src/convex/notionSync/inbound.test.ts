import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {Doc, Id} from '../_generated/dataModel';
import type {ActionCtx} from '../_generated/server';
import {geocodeAddress} from '../helpers/geocode';
import {retrievePage} from '../notion/client';
import {belongsToConfiguredDataSource} from '../notion/config';
import {readNotionPageFields} from '../notion/fields';
import type {NotionPage, NotionPageFields} from '../notion/types';
import {performInboundSync} from './inbound';
import {computeSyncHash} from './reconcile';
import type {ObjectSyncSnapshot} from './snapshot';
import type {AppSyncFields} from './types';

vi.mock('../notion/client', () => ({
    retrievePage: vi.fn(),
}));
vi.mock('../notion/config', () => ({
    belongsToConfiguredDataSource: vi.fn(() => true),
}));
vi.mock('../notion/fields', () => ({
    readNotionPageFields: vi.fn(),
}));
vi.mock('../helpers/geocode', () => ({
    geocodeAddress: vi.fn(),
}));

const editedTime = '2026-02-01T00:00:00.000Z';

const appFields: AppSyncFields = {
    name: 'Mosaic',
    categoryName: 'mosaic',
    address: 'Tverskaya 1',
    city: 'Moscow',
    country: 'Russia',
    mapLink: 'https://radioatelier.app/object/object-1',
    internalId: 'RA-1',
    installedPeriod: '1950s',
    isRemoved: false,
    removalPeriod: null,
    tagNames: ['sound'],
    isVisited: false,
    source: null,
};

const notionFields: NotionPageFields = {...appFields};

function makePage(overrides: Partial<NotionPage> = {}): NotionPage {
    return {
        id: 'page-1',
        last_edited_time: editedTime,
        created_by: {id: 'notion-user-1'},
        ...overrides,
    };
}

function makeSyncRecord(overrides: Partial<Doc<'objectNotionSync'>> = {}) {
    return {
        objectId: 'object-1',
        notionPageId: 'page-1',
        lastOutboundHash: null,
        lastInboundEditedTime: editedTime,
        archivedAt: null,
        lastSyncError: null,
        ...overrides,
    } as Doc<'objectNotionSync'>;
}

function makeSnapshot(fields: AppSyncFields = appFields): ObjectSyncSnapshot {
    return {
        objectId: 'object-1' as Id<'objects'>,
        owner: {_id: 'user-1' as Id<'users'>, notionSyncEnabled: true},
        sync: null,
        fields,
    } as ObjectSyncSnapshot;
}

// Queries are dispatched by their distinctive argument name: the sync-record
// lookup passes notionPageId, the snapshot passes objectId, and the owner
// resolution passes notionUserId.
function makeCtx(options: {
    syncRecord?: Doc<'objectNotionSync'> | null;
    snapshot?: ObjectSyncSnapshot | null;
    owner?: {_id: string} | null;
}) {
    const runQuery = vi.fn(async (_ref: unknown, args: Record<string, unknown>) => {
        if ('notionPageId' in args) {
            return options.syncRecord ?? null;
        }
        if ('objectId' in args) {
            return options.snapshot ?? null;
        }
        return options.owner ?? null;
    });
    const runMutation = vi.fn(async (_ref: unknown, _args: Record<string, unknown>) => null);
    return {ctx: {runQuery, runMutation} as unknown as ActionCtx, runQuery, runMutation};
}

describe('performInboundSync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(belongsToConfiguredDataSource).mockReturnValue(true);
        vi.mocked(retrievePage).mockResolvedValue(makePage());
        vi.mocked(readNotionPageFields).mockReturnValue({...notionFields});
    });

    it('deletes the linked Object for a deleted page without contacting Notion', async () => {
        const {ctx, runMutation} = makeCtx({syncRecord: makeSyncRecord()});

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.deleted'});

        expect(retrievePage).not.toHaveBeenCalled();
        expect(runMutation).toHaveBeenCalledTimes(1);
        expect(runMutation.mock.calls[0][1]).toEqual({objectId: 'object-1'});
    });

    it('ignores deleted pages that were never linked', async () => {
        const {ctx, runMutation} = makeCtx({syncRecord: null});

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.deleted'});

        expect(runMutation).not.toHaveBeenCalled();
    });

    it('deletes the linked Object when the page was archived in Notion', async () => {
        vi.mocked(retrievePage).mockResolvedValue(makePage({archived: true}));
        const {ctx, runMutation} = makeCtx({syncRecord: makeSyncRecord()});

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.properties_updated'});

        expect(runMutation).toHaveBeenCalledTimes(1);
        expect(runMutation.mock.calls[0][1]).toEqual({objectId: 'object-1'});
    });

    it('ignores pages outside the configured data source', async () => {
        vi.mocked(belongsToConfiguredDataSource).mockReturnValue(false);
        const {ctx, runMutation} = makeCtx({syncRecord: makeSyncRecord()});

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.properties_updated'});

        expect(runMutation).not.toHaveBeenCalled();
    });

    it('suppresses an echo without writing when the sync state is already current', async () => {
        const {ctx, runMutation} = makeCtx({
            syncRecord: makeSyncRecord({lastOutboundHash: computeSyncHash(notionFields)}),
            snapshot: makeSnapshot(),
        });

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.properties_updated'});

        expect(runMutation).not.toHaveBeenCalled();
    });

    it('records an echo when the edited time moved forward', async () => {
        const {ctx, runMutation} = makeCtx({
            syncRecord: makeSyncRecord({
                lastOutboundHash: computeSyncHash(notionFields),
                lastInboundEditedTime: '2026-01-01T00:00:00.000Z',
            }),
            snapshot: makeSnapshot(),
        });

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.properties_updated'});

        expect(runMutation).toHaveBeenCalledTimes(1);
        expect(runMutation.mock.calls[0][1]).toMatchObject({
            objectId: 'object-1',
            notionPageId: 'page-1',
            lastOutboundHash: computeSyncHash(notionFields),
            lastInboundEditedTime: editedTime,
        });
    });

    it('patches the linked Object with the inbound apply patch', async () => {
        vi.mocked(readNotionPageFields).mockReturnValue({
            ...notionFields,
            name: null,
            city: 'Berlin',
        });
        const {ctx, runMutation} = makeCtx({
            syncRecord: makeSyncRecord(),
            snapshot: makeSnapshot(),
        });

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.properties_updated'});

        expect(runMutation).toHaveBeenCalledTimes(1);
        expect(runMutation.mock.calls[0][1]).toEqual({
            objectId: 'object-1',
            notionPageId: 'page-1',
            patch: {city: 'Berlin'},
            lastInboundEditedTime: editedTime,
        });
    });

    it('skips a changed page when the Object snapshot is unavailable', async () => {
        vi.mocked(readNotionPageFields).mockReturnValue({...notionFields, city: 'Berlin'});
        const {ctx, runMutation} = makeCtx({syncRecord: makeSyncRecord(), snapshot: null});

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.properties_updated'});

        expect(runMutation).not.toHaveBeenCalled();
    });

    it('creates an Object for a new page after resolving owner and coordinates', async () => {
        vi.mocked(geocodeAddress).mockResolvedValue({latitude: 55.75, longitude: 37.61});
        const {ctx, runMutation} = makeCtx({
            syncRecord: null,
            owner: {_id: 'user-1'},
        });

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.created'});

        expect(runMutation).toHaveBeenCalledTimes(1);
        expect(runMutation.mock.calls[0][1]).toMatchObject({
            notionPageId: 'page-1',
            ownerId: 'user-1',
            latitude: 55.75,
            longitude: 37.61,
            fields: expect.objectContaining({name: 'Mosaic'}),
            lastInboundEditedTime: editedTime,
        });
    });

    it('drops a new page silently when geocoding fails', async () => {
        vi.mocked(geocodeAddress).mockResolvedValue(null);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const {ctx, runMutation} = makeCtx({syncRecord: null, owner: {_id: 'user-1'}});

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.created'});

        expect(runMutation).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it('drops a new page when no sync-enabled owner can be resolved', async () => {
        const {ctx, runMutation} = makeCtx({syncRecord: null, owner: null});

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.created'});

        expect(geocodeAddress).not.toHaveBeenCalled();
        expect(runMutation).not.toHaveBeenCalled();
    });
});
