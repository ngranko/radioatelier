import {ConvexError, v} from 'convex/values';
import {action} from './_generated/server';
import {parseGoogleAddress} from './utils/googleAddress';

interface GeocodeAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

export const getAddress = action({
    args: {
        latitude: v.number(),
        longitude: v.number(),
    },
    handler: async (ctx, {latitude, longitude}) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new ConvexError('Unauthorized');
        }

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
