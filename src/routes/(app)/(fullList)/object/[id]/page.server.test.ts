import {getFunctionName} from 'convex/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {actions} from './+page.server';

const mocks = vi.hoisted(() => ({mutation: vi.fn(), capture: vi.fn(), token: 'token'}));
vi.mock('$lib/server/convexClient', () => ({
    getConvexClient: async () => ({client: {mutation: mocks.mutation}, token: mocks.token}),
}));
vi.mock('$lib/server/posthog', () => ({getPostHogClient: () => ({capture: mocks.capture})}));

function createEvent() {
    const body = new FormData();
    body.set('isVisited', 'on');
    body.set('name', 'ignored shared field');
    body.set('isPublic', 'on');
    return {
        request: new Request('https://archive.test/object/object-1?/savePersonal', {
            method: 'POST',
            body,
        }),
        params: {id: 'object-1'},
        url: new URL('https://archive.test/object/object-1'),
        locals: {auth: () => ({userId: 'clerk-1'})},
    } as unknown as Parameters<NonNullable<typeof actions.savePersonal>>[0];
}

beforeEach(() => {
    vi.clearAllMocks();
    mocks.token = 'token';
    mocks.mutation.mockResolvedValue('object-1');
});

describe('personal Object save action', () => {
    it('keeps the existing full save action and its shared-field payload compatible', async () => {
        const event = createEvent();
        const body = new FormData();
        body.set('name', 'Mosaic');
        body.set('category', 'category-1');
        body.set('latitude', '55.75');
        body.set('longitude', '37.61');
        body.set('isVisited', 'on');
        await actions.save!({...event, request: new Request(event.url, {method: 'POST', body})});

        const [ref, args] = mocks.mutation.mock.calls[0];
        expect(getFunctionName(ref)).toBe('objects:update');
        expect(args).toMatchObject({
            id: 'object-1',
            data: {name: 'Mosaic', categoryId: 'category-1'},
        });
        expect(mocks.capture.mock.calls[0][0].properties).toEqual({
            object_id: 'object-1',
            is_visited: true,
            is_public: false,
            is_removed: false,
        });
    });

    it('saves only personal data and captures only the agreed event properties', async () => {
        const result = await actions.savePersonal!(createEvent());
        expect(result).toMatchObject({form: {valid: true}, id: 'object-1'});
        expect(mocks.mutation).toHaveBeenCalledTimes(1);
        const [ref, args] = mocks.mutation.mock.calls[0];
        expect(getFunctionName(ref)).toBe('objectPersonal:update');
        expect(args).toEqual({id: 'object-1', data: {isVisited: true, privateTags: []}});
        expect(mocks.capture).toHaveBeenCalledExactlyOnceWith({
            distinctId: 'clerk-1',
            event: 'object_updated',
            properties: {object_id: 'object-1', is_visited: true},
        });
    });

    it('redirects anonymous saves without writing or capturing an event', async () => {
        mocks.token = '';
        await expect(actions.savePersonal!(createEvent())).rejects.toMatchObject({
            status: 307,
            location: '/login?ref=%2Fobject%2Fobject-1',
        });
        expect(mocks.mutation).not.toHaveBeenCalled();
        expect(mocks.capture).not.toHaveBeenCalled();
    });

    it('reports persistence failures without a successful analytics event', async () => {
        mocks.mutation.mockRejectedValueOnce(new Error('not allowed'));
        const log = vi.spyOn(console, 'error').mockImplementation(() => {});
        await expect(actions.savePersonal!(createEvent())).rejects.toMatchObject({status: 500});
        expect(mocks.capture).not.toHaveBeenCalled();
        log.mockRestore();
    });
});
