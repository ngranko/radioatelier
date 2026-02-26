import {ConvexError, v} from 'convex/values';
import {action} from './_generated/server';

interface AddressComponent {
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
        if (data.statusCode >= 400) {
            throw new ConvexError('Failed to get address');
        }

        const streetNumber = findAddressComponent(
            data.results[0].address_components,
            'street_number',
        );
        const streetName = findAddressComponent(data.results[0].address_components, 'route');
        const city = findAddressComponent(data.results[0].address_components, 'locality');
        const country = findAddressComponent(data.results[0].address_components, 'country');

        return {
            address: composeAddress(streetNumber, streetName, country),
            city,
            country,
        };
    },
});

function findAddressComponent(components: AddressComponent[], type: string): string {
    return components.find(component => component.types.includes(type))?.long_name ?? '';
}

function composeAddress(streetNumber: string, streetName: string, country: string): string {
    if (!streetNumber) {
        return streetName;
    }

    if (!streetName) {
        return streetNumber;
    }

    if (['Россия', 'Беларусь', 'Украина', 'Казахстан'].includes(country)) {
        return streetName + ', ' + streetNumber;
    }

    return streetNumber + ' ' + streetName;
}
