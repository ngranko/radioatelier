import {beforeEach, describe, expect, it, vi} from 'vitest';

import type {Doc, Id} from '../_generated/dataModel';
import type {ActionCtx} from '../_generated/server';
import {createPage, retrieveDataSource, retrievePage, updatePage} from '../notion/client';
import {readNotionPageFields} from '../notion/fields';
import type {NotionDataSource, NotionPage} from '../notion/types';
import {
    performOutboundObjectSync,
    performOutboundObjectSyncBatch,
    performOutboundObjectSyncBatchLenient,
} from './outbound';
import {computeSyncHash} from './reconcile';
import type {ObjectSyncSnapshot} from './snapshot';
import type {AppSyncFields} from './types';

vi.mock('../notion/client', () => ({
    archivePage: vi.fn(),
    createPage: vi.fn(),
    retrieveDataSource: vi.fn(),
    retrievePage: vi.fn(),
    updatePage: vi.fn(),
}));
vi.mock('../notion/config', () => ({
    getNotionDataSourceId: () => 'ds-1',
    getNotionSyncAppUrl: () => 'https://radioatelier.app',
}));
vi.mock('../notion/fields', () => ({
    buildNotionPropertiesPayload: vi.fn(() => ({})),
    readNotionPageFields: vi.fn(),
}));

const fields: AppSyncFields = {
    name: 'Mosaic',
    categoryName: 'mosaic',
    address: 'Tverskaya 1',
    city: 'Moscow',
    country: 'Russia',
    mapLink: 'https://radioatelier.app/object/object-1',
    internalId: 'RA-1',
    installedPeriod: null,
    isRemoved: false,
    removalPeriod: null,
    tagNames: ['sound'],
    isVisited: true,
    source: null,
};

const editedTime = '2026-01-01T00:00:00.000Z';

function makeSnapshot(overrides: Partial<ObjectSyncSnapshot> = {}): ObjectSyncSnapshot {
    return {
        objectId: 'object-1' as Id<'objects'>,
        owner: {_id: 'user-1' as Id<'users'>, notionSyncEnabled: true},
        sync: null,
        fields,
        ...overrides,
    };
}

function makeSyncRecord(overrides: Partial<Doc<'objectNotionSync'>> = {}) {
    return {
        objectId: 'object-1',
        notionPageId: 'page-1',
        lastOutboundHash: computeSyncHash(fields),
        lastInboundEditedTime: editedTime,
        archivedAt: null,
        lastSyncError: null,
        ...overrides,
    } as Doc<'objectNotionSync'>;
}

function makeCtx(snapshot: ObjectSyncSnapshot | null) {
    const runQuery = vi.fn(async () => snapshot);
    const runMutation = vi.fn(async (_ref: unknown, _args: Record<string, unknown>) => null);
    return {
        ctx: {runQuery, runMutation} as unknown as ActionCtx,
        runQuery,
        runMutation,
    };
}

function makeBatchCtx(snapshots: Record<string, ObjectSyncSnapshot | null>) {
    const runQuery = vi.fn(
        async (_ref: unknown, args: {objectId: string}) => snapshots[args.objectId],
    );
    const runMutation = vi.fn(async (_ref: unknown, _args: Record<string, unknown>) => null);
    return {
        ctx: {runQuery, runMutation} as unknown as ActionCtx,
        runQuery,
        runMutation,
    };
}

describe('performOutboundObjectSync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(retrieveDataSource).mockResolvedValue({id: 'ds-1'} as NotionDataSource);
        vi.mocked(retrievePage).mockResolvedValue({
            id: 'page-1',
            last_edited_time: editedTime,
        } as NotionPage);
        vi.mocked(readNotionPageFields).mockReturnValue({...fields});
    });

    it('does nothing when the owner is not sync-enabled', async () => {
        const {ctx, runMutation} = makeCtx(
            makeSnapshot({owner: {_id: 'user-1' as Id<'users'>, notionSyncEnabled: false}}),
        );

        const result = await performOutboundObjectSync(ctx, 'object-1' as Id<'objects'>);

        expect(result).toBeNull();
        expect(retrieveDataSource).not.toHaveBeenCalled();
        expect(runMutation).not.toHaveBeenCalled();
    });

    it('creates a Notion page and records the sync state for new Objects', async () => {
        vi.mocked(createPage).mockResolvedValue({
            id: 'page-1',
            last_edited_time: editedTime,
        } as NotionPage);
        const {ctx, runMutation} = makeCtx(makeSnapshot());

        const result = await performOutboundObjectSync(ctx, 'object-1' as Id<'objects'>);

        expect(result).toBe('page-1');
        expect(createPage).toHaveBeenCalledTimes(1);
        expect(runMutation).toHaveBeenCalledTimes(1);
        expect(runMutation.mock.calls[0][1]).toMatchObject({
            objectId: 'object-1',
            notionPageId: 'page-1',
            lastOutboundHash: computeSyncHash(fields),
            lastInboundEditedTime: editedTime,
            lastSyncError: null,
        });
    });

    it('updates the linked page only when the fields differ', async () => {
        vi.mocked(readNotionPageFields).mockReturnValue({...fields, name: 'Stale name'});
        vi.mocked(updatePage).mockResolvedValue({
            id: 'page-1',
            last_edited_time: '2026-01-02T00:00:00.000Z',
        } as NotionPage);
        const {ctx, runMutation} = makeCtx(makeSnapshot({sync: makeSyncRecord()}));

        const result = await performOutboundObjectSync(ctx, 'object-1' as Id<'objects'>);

        expect(result).toBe('page-1');
        expect(createPage).not.toHaveBeenCalled();
        expect(updatePage).toHaveBeenCalledTimes(1);
        expect(runMutation.mock.calls[0][1]).toMatchObject({
            lastInboundEditedTime: '2026-01-02T00:00:00.000Z',
        });
    });

    it('skips the Notion write and the state write when already in sync', async () => {
        const {ctx, runMutation} = makeCtx(makeSnapshot({sync: makeSyncRecord()}));

        const result = await performOutboundObjectSync(ctx, 'object-1' as Id<'objects'>);

        expect(result).toBe('page-1');
        expect(updatePage).not.toHaveBeenCalled();
        expect(runMutation).not.toHaveBeenCalled();
    });

    it('records the failure on the sync state record and rethrows', async () => {
        vi.mocked(retrieveDataSource).mockRejectedValue(new Error('Notion is down'));
        const {ctx, runMutation} = makeCtx(makeSnapshot());

        await expect(performOutboundObjectSync(ctx, 'object-1' as Id<'objects'>)).rejects.toThrow(
            'Notion is down',
        );

        expect(runMutation).toHaveBeenCalledTimes(1);
        expect(runMutation.mock.calls[0][1]).toMatchObject({
            objectId: 'object-1',
            message: 'Notion is down',
        });
    });

    it('keeps strict batch failures visible to existing callers', async () => {
        vi.mocked(createPage)
            .mockResolvedValueOnce({id: 'page-1', last_edited_time: editedTime} as NotionPage)
            .mockRejectedValueOnce(new Error('Notion rejected object-2'));
        const {ctx, runMutation} = makeBatchCtx({
            'object-1': makeSnapshot({objectId: 'object-1' as Id<'objects'>}),
            'object-2': makeSnapshot({objectId: 'object-2' as Id<'objects'>}),
            'object-3': makeSnapshot({objectId: 'object-3' as Id<'objects'>}),
        });

        await expect(
            performOutboundObjectSyncBatch(ctx, [
                'object-1',
                'object-2',
                'object-3',
            ] as Id<'objects'>[]),
        ).rejects.toThrow('Notion rejected object-2');

        expect(createPage).toHaveBeenCalledTimes(2);
        expect(runMutation).toHaveBeenCalledTimes(2);
        expect(runMutation.mock.calls[1][1]).toMatchObject({
            objectId: 'object-2',
            message: 'Notion rejected object-2',
        });
    });

    it('continues lenient batch sync when one object fails to create in Notion', async () => {
        vi.mocked(createPage)
            .mockResolvedValueOnce({id: 'page-1', last_edited_time: editedTime} as NotionPage)
            .mockRejectedValueOnce(new Error('Notion rejected object-2'))
            .mockResolvedValueOnce({id: 'page-3', last_edited_time: editedTime} as NotionPage);
        const {ctx, runMutation} = makeBatchCtx({
            'object-1': makeSnapshot({objectId: 'object-1' as Id<'objects'>}),
            'object-2': makeSnapshot({objectId: 'object-2' as Id<'objects'>}),
            'object-3': makeSnapshot({objectId: 'object-3' as Id<'objects'>}),
        });

        const result = await performOutboundObjectSyncBatchLenient(ctx, [
            'object-1',
            'object-2',
            'object-3',
        ] as Id<'objects'>[]);

        expect(result).toEqual({synced: 2, skipped: 0, failed: 1});
        expect(createPage).toHaveBeenCalledTimes(3);
        expect(runMutation).toHaveBeenCalledTimes(3);
        expect(runMutation.mock.calls[1][1]).toMatchObject({
            objectId: 'object-2',
            message: 'Notion rejected object-2',
        });
    });
});
