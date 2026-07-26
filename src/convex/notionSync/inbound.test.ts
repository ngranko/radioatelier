import {getFunctionName} from 'convex/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {internal} from '../_generated/api';
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

function expectMutationRef(runMutation: ReturnType<typeof vi.fn>, ref: unknown) {
    expect(getFunctionName(runMutation.mock.calls[0][0])).toBe(getFunctionName(ref as never));
}

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

function makeCtx(...queryResults: unknown[]) {
    const runQuery = vi.fn(async () => queryResults.shift() ?? null);
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
        const {ctx, runMutation} = makeCtx(makeSyncRecord());

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.deleted'});

        expect(retrievePage).not.toHaveBeenCalled();
        expect(runMutation).toHaveBeenCalledTimes(1);
        expectMutationRef(runMutation, internal.objectsSync.deleteObjectFromSync);
        expect(runMutation.mock.calls[0][1]).toEqual({objectId: 'object-1'});
    });

    it('deletes the linked Object when the page was archived in Notion', async () => {
        vi.mocked(retrievePage).mockResolvedValue(makePage({archived: true}));
        const {ctx, runMutation} = makeCtx(makeSyncRecord());

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.properties_updated'});

        expect(runMutation).toHaveBeenCalledTimes(1);
        expectMutationRef(runMutation, internal.objectsSync.deleteObjectFromSync);
        expect(runMutation.mock.calls[0][1]).toEqual({objectId: 'object-1'});
    });

    it('ignores pages outside the configured data source', async () => {
        vi.mocked(belongsToConfiguredDataSource).mockReturnValue(false);
        const {ctx, runMutation} = makeCtx(makeSyncRecord());

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.properties_updated'});

        expect(runMutation).not.toHaveBeenCalled();
    });

    it('records an echo when the edited time moved forward', async () => {
        const {ctx, runMutation} = makeCtx(
            makeSyncRecord({
                lastOutboundHash: computeSyncHash(notionFields),
                lastInboundEditedTime: '2026-01-01T00:00:00.000Z',
            }),
            makeSnapshot(),
        );

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.properties_updated'});

        expect(runMutation).toHaveBeenCalledTimes(1);
        expectMutationRef(runMutation, internal.notionSync.state.upsertSyncState);
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
        const {ctx, runMutation} = makeCtx(makeSyncRecord(), makeSnapshot());

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.properties_updated'});

        expect(runMutation).toHaveBeenCalledTimes(1);
        expectMutationRef(runMutation, internal.objectsSync.patchObjectFromSync);
        expect(runMutation.mock.calls[0][1]).toEqual({
            objectId: 'object-1',
            notionPageId: 'page-1',
            patch: {city: 'Berlin'},
            lastInboundEditedTime: editedTime,
        });
    });

    it('creates an Object for a new page after resolving owner and coordinates', async () => {
        vi.mocked(geocodeAddress).mockResolvedValue({latitude: 55.75, longitude: 37.61});
        const {ctx, runMutation} = makeCtx(null, {_id: 'user-1'});

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.created'});

        expect(runMutation).toHaveBeenCalledTimes(1);
        expectMutationRef(runMutation, internal.objectsSync.createObjectFromSync);
        expect(runMutation.mock.calls[0][1]).toMatchObject({
            notionPageId: 'page-1',
            ownerId: 'user-1',
            latitude: 55.75,
            longitude: 37.61,
            fields: expect.objectContaining({name: 'Mosaic'}),
            lastInboundEditedTime: editedTime,
        });
    });

    it('does not create an Object when geocoding fails', async () => {
        vi.mocked(geocodeAddress).mockResolvedValue(null);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const {ctx, runMutation} = makeCtx(null, {_id: 'user-1'});

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.created'});

        expect(runMutation).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('drops a new page when no sync-enabled owner can be resolved', async () => {
        const {ctx, runMutation} = makeCtx(null, null);

        await performInboundSync(ctx, {pageId: 'page-1', eventType: 'page.created'});

        expect(geocodeAddress).not.toHaveBeenCalled();
        expect(runMutation).not.toHaveBeenCalled();
    });
});
