import {getFunctionName} from 'convex/server';
import {describe, expect, it, vi} from 'vitest';
import type {Id} from './_generated/dataModel';
import type {MutationCtx} from './_generated/server';
import {matchIndexRange, type IndexRange} from './helpers/mockIndexRange';
import {updateObjectPersonalState} from './helpers/objectPersonalState';
import {getVisitedChunkId} from './utils/visitedChunks';

const objectId = 'object-1' as Id<'objects'>;
const privateTagId = 'private-1' as Id<'privateTags'>;
const data = {isVisited: true, privateTags: [privateTagId]};

function createContext(userId = 'viewer') {
    const user = {
        _id: userId as Id<'users'>,
        _creationTime: 0,
        email: 'viewer@example.test',
        externalId: 'clerk-1',
        role: 'user',
        isDeleted: false,
        notionSyncEnabled: true,
    };
    const object = {
        _id: objectId,
        createdById: 'owner',
        isPublic: true,
        name: 'Mosaic',
        description: 'Keep this',
        coverId: 'image-1',
        categoryId: 'category-1',
    };
    const tag = {_id: privateTagId, createdById: userId};
    const visited = {
        _id: 'visited-1',
        userId,
        chunkId: getVisitedChunkId(objectId),
        visitedObjectIds: [] as string[],
    };
    const association = {
        _id: 'association-1',
        objectId,
        userId,
        privateTagIds: [] as Id<'privateTags'>[],
    };
    const docs = new Map<string, unknown>([
        ['objects:object-1', object],
        ['privateTags:private-1', tag],
    ]);
    const rows: Record<string, Record<string, unknown>[]> = {
        objects: [object],
        objectImages: [{_id: 'link-1', objectId, imageId: 'image-1', position: 0}],
        userVisitedChunks: [visited],
        objectPrivateTags: [association],
    };
    const db = {
        get: vi.fn(async (table: string, id: string) => docs.get(`${table}:${id}`) ?? null),
        query: vi.fn((table: string) => ({
            withIndex: (_name: string, range: (q: IndexRange) => IndexRange) => ({
                unique: async () => rows[table]?.find(matchIndexRange(range)) ?? null,
            }),
        })),
        patch: vi.fn(async (table: string, id: string, patch: Record<string, unknown>) => {
            const row = rows[table]?.find(row => row._id === id);
            if (!row) {
                throw new Error(`Missing test record: ${table}/${id}`);
            }
            Object.assign(row, patch);
        }),
        insert: vi.fn(async (table: string, values: Record<string, unknown>) => {
            const id = `new-${table}`;
            (rows[table] ??= []).push({...values, _id: id});
            return id;
        }),
        delete: vi.fn(async (table: string, id: string) => {
            rows[table] = rows[table].filter(row => row._id !== id);
        }),
    };
    const scheduler = {runAfter: vi.fn()};
    return {
        ctx: {db, scheduler} as unknown as MutationCtx,
        db,
        scheduler,
        object,
        user,
        visited,
        docs,
        rows,
        association,
    };
}

describe('personal Object writes', () => {
    it.each([true, false])(
        'saves or clears personal state without changing shared fields or gallery, visited=%s',
        async isVisited => {
            const {ctx, user, scheduler, visited, association, rows} = createContext();
            visited.visitedObjectIds = isVisited ? [] : [objectId];
            association.privateTagIds = isVisited ? [] : [privateTagId];
            const before = structuredClone({objects: rows.objects, gallery: rows.objectImages});

            await expect(
                updateObjectPersonalState(ctx, objectId, user, {
                    isVisited,
                    privateTags: isVisited ? [privateTagId] : [],
                }),
            ).resolves.toBe(objectId);

            expect(
                rows.objectPrivateTags.find(row => row.userId === user._id)?.privateTagIds,
            ).toEqual(isVisited ? [privateTagId] : []);
            const chunk = rows.userVisitedChunks.find(row => row.userId === user._id);
            expect(
                (chunk?.visitedObjectIds as string[] | undefined)?.includes(objectId) ?? false,
            ).toBe(isVisited);
            expect({objects: rows.objects, gallery: rows.objectImages}).toEqual(before);
            expect(scheduler.runAfter).not.toHaveBeenCalled();
        },
    );

    it('rejects a non-owner if the Object became private during editing', async () => {
        const {ctx, user, db, object} = createContext();
        object.isPublic = false;
        await expect(updateObjectPersonalState(ctx, objectId, user, data)).rejects.toThrow(
            'Not allowed',
        );
        expect(db.patch).not.toHaveBeenCalled();
        expect(db.delete).not.toHaveBeenCalled();
    });

    it.each(['missing', 'foreign'])(
        'rejects a %s private tag before either personal write',
        async status => {
            const {ctx, user, db, docs} = createContext();
            if (status === 'missing') {
                docs.delete('privateTags:private-1');
            } else {
                docs.set('privateTags:private-1', {_id: privateTagId, createdById: 'someone-else'});
            }
            await expect(
                updateObjectPersonalState(ctx, objectId, user, data),
            ).rejects.toMatchObject({
                data: {code: 'notFound'},
            });
            expect(db.patch).not.toHaveBeenCalled();
            expect(db.delete).not.toHaveBeenCalled();
        },
    );

    it('syncs an owner visited change on a private Object', async () => {
        const {ctx, user, object, scheduler} = createContext('owner');
        object.isPublic = false;
        await updateObjectPersonalState(ctx, objectId, user, data);

        expect(scheduler.runAfter).toHaveBeenCalledTimes(1);
        const [, ref, args] = scheduler.runAfter.mock.calls[0];
        expect(getFunctionName(ref)).toBe('notionSync/outbound:enqueueOutboundObjectSync');
        expect(args).toEqual({objectId});
    });

    it.each(['unchanged', 'disabled'])('skips owner sync when visited is %s', async state => {
        const {ctx, user, visited, scheduler} = createContext('owner');
        if (state === 'unchanged') {
            visited.visitedObjectIds = [objectId];
        } else {
            user.notionSyncEnabled = false;
        }
        await updateObjectPersonalState(ctx, objectId, user, data);
        expect(scheduler.runAfter).not.toHaveBeenCalled();
    });
});
