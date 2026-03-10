import {makeFunctionReference} from 'convex/server';
import {ConvexError, v} from 'convex/values';
import type {Id} from './_generated/dataModel';
import {action, type ActionCtx} from './_generated/server';
import {searchGooglePlaces} from './search/googlePlaces';
import {createTypesenseSearchClient} from './typesense/client';
import {searchObjectsInTypesense} from './typesense/objects';

const currentUser = makeFunctionReference<'query'>('users:current');

const searchArgs = {
    query: v.string(),
    latitude: v.number(),
    longitude: v.number(),
};

const LOCAL_PAGE_SIZE = 20;
const PREVIEW_LOCAL_LIMIT = 5;
const PREVIEW_GOOGLE_LIMIT = 2;

export const preview = action({
    args: searchArgs,
    handler: async (ctx, args) => {
        const userId = await requireCurrentUserId(ctx);
        const coordinateItem = toCoordinateSearchItem(args.query);
        if (coordinateItem) {
            return {
                items: [coordinateItem],
                hasMore: false,
                offset: 0,
            };
        }

        const client = createTypesenseSearchClient();
        const localItems = await searchObjectsInTypesense(client, {
            query: args.query,
            latitude: args.latitude,
            longitude: args.longitude,
            ownerId: userId,
            limit: PREVIEW_LOCAL_LIMIT + 1,
        });

        let googleItems: Awaited<ReturnType<typeof searchGooglePlaces>>['items'] = [];
        try {
            const googleResults = await searchGooglePlaces({
                query: args.query,
                latitude: args.latitude,
                longitude: args.longitude,
                limit: PREVIEW_GOOGLE_LIMIT + 1,
                pageToken: '',
            });
            googleItems = googleResults.items;
        } catch (error) {
            console.warn('Preview Google search failed', error);
        }

        return {
            items: [
                ...localItems.slice(0, PREVIEW_LOCAL_LIMIT),
                ...googleItems.slice(0, PREVIEW_GOOGLE_LIMIT),
            ],
            hasMore:
                localItems.length > PREVIEW_LOCAL_LIMIT ||
                googleItems.length > PREVIEW_GOOGLE_LIMIT,
        };
    },
});

export const local = action({
    args: {
        ...searchArgs,
        offset: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await requireCurrentUserId(ctx);
        const client = createTypesenseSearchClient();
        const items = await searchObjectsInTypesense(client, {
            query: args.query,
            latitude: args.latitude,
            longitude: args.longitude,
            ownerId: userId,
            offset: args.offset,
            limit: LOCAL_PAGE_SIZE + 1,
        });

        return {
            items: items.slice(0, LOCAL_PAGE_SIZE),
            hasMore: items.length > LOCAL_PAGE_SIZE,
            offset: args.offset + LOCAL_PAGE_SIZE,
        };
    },
});

export const google = action({
    args: {
        ...searchArgs,
        pageToken: v.string(),
    },
    handler: async (ctx, args) => {
        await requireCurrentUserId(ctx);
        const results = await searchGooglePlaces({
            query: args.query,
            latitude: args.latitude,
            longitude: args.longitude,
            limit: LOCAL_PAGE_SIZE,
            pageToken: args.pageToken,
        });

        return {
            items: results.items,
            hasMore: results.nextPageToken !== '',
            nextPageToken: results.nextPageToken,
        };
    },
});

async function requireCurrentUserId(ctx: ActionCtx) {
    const user = await ctx.runQuery(currentUser, {});
    if (!user) {
        throw new ConvexError('Unauthorized');
    }

    return user._id as Id<'users'>;
}

function toCoordinateSearchItem(query: string) {
    const coordinates = parseCoordinateQuery(query);
    if (!coordinates) {
        return null;
    }

    return {
        id: null,
        name: '',
        categoryName: '',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        address: '',
        city: '',
        country: '',
        type: 'local' as const,
    };
}

function parseCoordinateQuery(query: string) {
    const parts = query.split(',');
    if (parts.length !== 2) {
        return null;
    }

    const latitude = Number(parts[0].trim());
    const longitude = Number(parts[1].trim());

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        return null;
    }

    return {latitude, longitude};
}
