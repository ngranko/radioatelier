import {ActionCache} from '@convex-dev/action-cache';
import {ConvexError, v} from 'convex/values';
import {components, internal} from './_generated/api';
import {
    type ActionCtx,
    action,
    internalAction,
    internalMutation,
    type MutationCtx,
} from './_generated/server';
import {consumeGoogleQuota} from './helpers/googleQuota';
import {type ParsedGoogleAddress, parseGoogleAddress} from './utils/googleAddress';

interface Coordinates {
    latitude: number;
    longitude: number;
}

interface GeocodeAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

// ~1 m: fine enough to keep street addresses exact, while repeat lookups of the
// same point still share one Geocoding request.
const COORDINATE_PRECISION = 5;
const ADDRESS_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const ADDRESS_CACHE_NAME = 'reverseGeocodeV1';
// Outlives a normal Geocoding round trip, yet frees the coordinate soon after a
// lookup that died without releasing it.
const LOOKUP_LEASE_MS = 1000 * 30;
const LEASE_POLL_INTERVAL_MS = 200;

const addressCache = new ActionCache(components.actionCache, {
    action: internal.locations.fetchAddress,
    name: ADDRESS_CACHE_NAME,
    ttl: ADDRESS_CACHE_TTL_MS,
});

const coordinatesArgs = {
    latitude: v.number(),
    longitude: v.number(),
};

export const getAddress = action({
    args: coordinatesArgs,
    handler: async (ctx, {latitude, longitude}): Promise<ParsedGoogleAddress> => {
        if ((await ctx.auth.getUserIdentity()) === null) {
            throw new ConvexError('Unauthorized');
        }

        return await fetchAddressOnce(ctx, {
            latitude: roundCoordinate(latitude),
            longitude: roundCoordinate(longitude),
        });
    },
});

// Actions don't share memory, so simultaneous misses for one coordinate are
// coalesced through a lease row: its holder hits Google while the rest wait for
// the cache to fill, taking over only if the holder fails or its lease lapses.
async function fetchAddressOnce(
    ctx: ActionCtx,
    coordinates: Coordinates,
): Promise<ParsedGoogleAddress> {
    for (;;) {
        const cached = await ctx.runQuery(components.actionCache.lib.get, {
            name: ADDRESS_CACHE_NAME,
            args: coordinates,
            ttl: ADDRESS_CACHE_TTL_MS,
        });
        if (cached.kind === 'hit') {
            return cached.value;
        }
        if (await ctx.runMutation(internal.locations.claimLookupLease, coordinates)) {
            try {
                return await addressCache.fetch(ctx, coordinates);
            } finally {
                await ctx.runMutation(internal.locations.releaseLookupLease, coordinates);
            }
        }
        await new Promise(resolve => setTimeout(resolve, LEASE_POLL_INTERVAL_MS));
    }
}

export const claimLookupLease = internalMutation({
    args: coordinatesArgs,
    handler: async (ctx, coordinates) => {
        const lease = await findLookupLease(ctx, coordinates);
        const expiresAt = Date.now() + LOOKUP_LEASE_MS;
        if (!lease) {
            await ctx.db.insert('geocodeLookupLeases', {...coordinates, expiresAt});
            return true;
        }
        if (lease.expiresAt > Date.now()) {
            return false;
        }
        await ctx.db.patch(lease._id, {expiresAt});
        return true;
    },
});

export const releaseLookupLease = internalMutation({
    args: coordinatesArgs,
    handler: async (ctx, coordinates) => {
        const lease = await findLookupLease(ctx, coordinates);
        if (lease) {
            await ctx.db.delete(lease._id);
        }
    },
});

function findLookupLease(ctx: MutationCtx, {latitude, longitude}: Coordinates) {
    return ctx.db
        .query('geocodeLookupLeases')
        .withIndex('byLatitudeAndLongitude', q =>
            q.eq('latitude', latitude).eq('longitude', longitude),
        )
        .unique();
}

export const fetchAddress = internalAction({
    args: coordinatesArgs,
    // The cache only runs this on a miss, so cached addresses stay free. Actions
    // called through ctx.runAction inherit the caller's auth, which keys the quota.
    handler: async (ctx, {latitude, longitude}) => {
        await consumeGoogleQuota(ctx);
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=ru&key=${process.env.GOOGLE_API_KEY}`,
        );
        if (!response.ok) {
            throw new ConvexError('Failed to get address');
        }

        const data = await response.json();
        if (data.status !== 'OK' || !data.results?.[0]?.address_components) {
            throw new ConvexError('Failed to get address');
        }

        return parseGoogleAddress(
            data.results[0].address_components.map((component: GeocodeAddressComponent) => ({
                text: component.long_name,
                shortText: component.short_name,
                types: component.types,
            })),
        );
    },
});

function roundCoordinate(value: number) {
    return Number(value.toFixed(COORDINATE_PRECISION));
}
