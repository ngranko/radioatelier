import {getFunctionName} from 'convex/server';
import {describe, expect, it, vi} from 'vitest';
import type {Id} from './_generated/dataModel';
import type {MutationCtx} from './_generated/server';
import {matchIndexRange, type IndexRange} from './helpers/mockIndexRange';
import {update} from './objectPersonal';
import type {ObjectPersonalData} from './sharedValidators';
import {getVisitedChunkId} from './utils/visitedChunks';

const objectId = 'object-1' as Id<'objects'>;
const privateTagId = 'private-1' as Id<'privateTags'>;
const data = {isVisited: true, privateTags: [privateTagId]};

// Convex attaches the handler at runtime but strips it from its published types.
const handleUpdate = (
    update as unknown as {
        _handler(
            this: void,
            ctx: MutationCtx,
            args: {id: Id<'objects'>; data: ObjectPersonalData},
        ): Promise<Id<'objects'>>;
    }
)._handler;

function createContext(userId = 'viewer') {
    const user = {_id: userId, externalId: 'clerk-1', isDeleted: false, notionSyncEnabled: true};
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
    const association = {_id: 'association-1', objectId, userId, privateTagIds: []};
    const docs = new Map<string, unknown>([
        ['objects:object-1', object],
        ['privateTags:private-1', tag],
    ]);
    const rows: Record<string, Record<string, unknown>[]> = {
        users: [user],
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
        patch: vi.fn(),
        insert: vi.fn(),
        delete: vi.fn(),
    };
    const auth = {getUserIdentity: vi.fn(async () => ({subject: user.externalId}) as unknown)};
    const scheduler = {runAfter: vi.fn()};
    return {
        ctx: {db, auth, scheduler} as unknown as MutationCtx,
        db,
        auth,
        scheduler,
        object,
        user,
        visited,
        docs,
    };
}

describe('personal Object writes', () => {
    it.each([true, false])(
        'saves or clears personal state without touching shared fields or gallery, visited=%s',
        async isVisited => {
            const {ctx, db, object, scheduler, visited} = createContext();
            visited.visitedObjectIds = isVisited ? [] : [objectId];
            const before = structuredClone(object);

            await expect(
                handleUpdate(ctx, {
                    id: objectId,
                    data: {
                        isVisited,
                        privateTags: isVisited ? [privateTagId] : [],
                    },
                }),
            ).resolves.toBe(objectId);

            expect(object).toEqual(before);
            expect(db.patch.mock.calls).toEqual(
                isVisited
                    ? [
                          ['objectPrivateTags', 'association-1', {privateTagIds: [privateTagId]}],
                          ['userVisitedChunks', 'visited-1', {visitedObjectIds: [objectId]}],
                      ]
                    : [['objectPrivateTags', 'association-1', {privateTagIds: []}]],
            );
            expect(db.delete.mock.calls).toEqual(
                isVisited ? [] : [['userVisitedChunks', 'visited-1']],
            );
            expect(db.insert).not.toHaveBeenCalled();
            expect(db.get.mock.calls.map(([table]) => table)).not.toContain('images');
            expect(scheduler.runAfter).not.toHaveBeenCalled();
        },
    );

    it.each(['anonymous', 'deleted'])('rejects an %s user before any writes', async status => {
        const {ctx, db, auth, user, scheduler} = createContext();
        if (status === 'anonymous') {
            auth.getUserIdentity.mockResolvedValue(null);
        } else {
            user.isDeleted = true;
        }

        await expect(handleUpdate(ctx, {id: objectId, data})).rejects.toThrow(
            "Can't get current user",
        );
        expect(db.patch).not.toHaveBeenCalled();
        expect(db.insert).not.toHaveBeenCalled();
        expect(db.delete).not.toHaveBeenCalled();
        expect(scheduler.runAfter).not.toHaveBeenCalled();
    });

    it('rejects a non-owner if the Object became private during editing', async () => {
        const {ctx, db, object} = createContext();
        object.isPublic = false;
        await expect(handleUpdate(ctx, {id: objectId, data})).rejects.toThrow('Not allowed');
        expect(db.patch).not.toHaveBeenCalled();
        expect(db.delete).not.toHaveBeenCalled();
    });

    it.each(['missing', 'foreign'])(
        'rejects a %s private tag before either personal write',
        async status => {
            const {ctx, db, docs} = createContext();
            if (status === 'missing') {
                docs.delete('privateTags:private-1');
            } else {
                docs.set('privateTags:private-1', {_id: privateTagId, createdById: 'someone-else'});
            }
            await expect(handleUpdate(ctx, {id: objectId, data})).rejects.toMatchObject({
                data: {code: 'notFound'},
            });
            expect(db.patch).not.toHaveBeenCalled();
            expect(db.delete).not.toHaveBeenCalled();
        },
    );

    it.each([true, false])(
        'syncs an owner visited change on a private Object, visited=%s',
        async isVisited => {
            const {ctx, object, visited, scheduler} = createContext('owner');
            object.isPublic = false;
            visited.visitedObjectIds = isVisited ? [] : [objectId];
            await handleUpdate(ctx, {id: objectId, data: {...data, isVisited}});

            expect(scheduler.runAfter).toHaveBeenCalledTimes(1);
            const [delay, ref, args] = scheduler.runAfter.mock.calls[0];
            expect(delay).toBe(0);
            expect(getFunctionName(ref)).toBe('notionSync/outbound:enqueueOutboundObjectSync');
            expect(args).toEqual({objectId});
        },
    );

    it.each(['unchanged', 'disabled'])('skips owner sync when visited is %s', async state => {
        const {ctx, user, visited, scheduler} = createContext('owner');
        if (state === 'unchanged') {
            visited.visitedObjectIds = [objectId];
        } else {
            user.notionSyncEnabled = false;
        }
        await handleUpdate(ctx, {id: objectId, data});
        expect(scheduler.runAfter).not.toHaveBeenCalled();
    });

    it('rejects a missing Object without creating personal records', async () => {
        const {ctx, db, docs} = createContext();
        docs.delete('objects:object-1');
        await expect(handleUpdate(ctx, {id: objectId, data})).rejects.toThrow('Object not found');
        expect(db.patch).not.toHaveBeenCalled();
        expect(db.insert).not.toHaveBeenCalled();
    });
});
