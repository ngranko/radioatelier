import {makeFunctionReference} from 'convex/server';
import {ConvexError, v} from 'convex/values';
import type {Id} from './_generated/dataModel';
import {action, type ActionCtx} from './_generated/server';
import {getGooglePlaceDetails, searchGooglePlaces} from './search/googlePlaces';
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

        const localPage = await searchLocalPage(userId, args, PREVIEW_LOCAL_LIMIT);

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
            items: [...localPage.items, ...googleItems.slice(0, PREVIEW_GOOGLE_LIMIT)],
            hasMore: localPage.hasMore || googleItems.length > PREVIEW_GOOGLE_LIMIT,
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
        const page = await searchLocalPage(userId, args, LOCAL_PAGE_SIZE, args.offset);

        return {
            ...page,
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

export const googlePlaceDetails = action({
    args: {
        placeId: v.string(),
    },
    handler: async (ctx, args) => {
        await requireCurrentUserId(ctx);
        return await getGooglePlaceDetails(args.placeId);
    },
});

// Fetches one extra row so hasMore reflects the actual index state instead of
// guessing from a full page.
async function searchLocalPage(
    userId: Id<'users'>,
    args: {query: string; latitude: number; longitude: number},
    limit: number,
    offset = 0,
) {
    const client = createTypesenseSearchClient();
    const items = await searchObjectsInTypesense(client, {
        query: args.query,
        latitude: args.latitude,
        longitude: args.longitude,
        ownerId: userId,
        offset,
        limit: limit + 1,
    });

    return {
        items: items.slice(0, limit),
        hasMore: items.length > limit,
    };
}

async function requireCurrentUserId(ctx: ActionCtx) {
    const user = await ctx.runQuery(currentUser, {});
    if (!user) {
        throw new ConvexError('Unauthorized');
    }

    return user._id;
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
        googlePlaceId: null,
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
