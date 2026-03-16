import {parseGoogleAddress} from '../utils/googleAddress';

type GooglePlaceSearchResponse = {
    places?: GooglePlace[];
    nextPageToken?: string;
};

type GooglePlace = {
    displayName?: {
        text?: string;
    };
    primaryTypeDisplayName?: {
        text?: string;
    };
    formattedAddress?: string;
    addressComponents?: GooglePlaceAddressComponent[];
    location?: {
        latitude?: number;
        longitude?: number;
    };
};

type GooglePlaceAddressComponent = {
    longText?: string;
    shortText?: string;
    types?: string[];
};

export interface GoogleSearchItem {
    id: null;
    name: string;
    categoryName: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
    type: 'google';
}

export interface GoogleSearchResults {
    items: GoogleSearchItem[];
    nextPageToken: string;
}

interface SearchOptions {
    query: string;
    latitude: number;
    longitude: number;
    limit: number;
    pageToken: string;
}

const GOOGLE_TEXT_SEARCH_FIELD_MASK = [
    'places.displayName',
    'places.primaryTypeDisplayName',
    'places.formattedAddress',
    'places.addressComponents',
    'places.location',
    'nextPageToken',
].join(',');

export async function searchGooglePlaces(options: SearchOptions): Promise<GoogleSearchResults> {
    const apiKey = process.env.GOOGLE_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('Missing GOOGLE_API_KEY environment variable');
    }

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': GOOGLE_TEXT_SEARCH_FIELD_MASK,
        },
        body: JSON.stringify({
            textQuery: options.query,
            languageCode: 'ru',
            locationBias: {
                circle: {
                    center: {
                        latitude: options.latitude,
                        longitude: options.longitude,
                    },
                    radius: 50000,
                },
            },
            pageSize: options.limit,
            ...(options.pageToken ? {pageToken: options.pageToken} : {}),
        }),
    });

    if (!response.ok) {
        throw new Error(`Google Places search failed with status ${response.status}`);
    }

    const data = (await response.json()) as GooglePlaceSearchResponse;

    return {
        items: (data.places ?? [])
            .map(toGoogleSearchItem)
            .filter((item): item is GoogleSearchItem => item !== null),
        nextPageToken: data.nextPageToken ?? '',
    };
}

function toGoogleSearchItem(place: GooglePlace): GoogleSearchItem | null {
    const latitude = Number(place.location?.latitude);
    const longitude = Number(place.location?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
    }

    const parsedAddress = parseGoogleAddress(
        (place.addressComponents ?? []).map(component => ({
            text: component.longText ?? '',
            shortText: component.shortText,
            types: component.types ?? [],
        })),
        place.formattedAddress ?? '',
    );

    return {
        id: null,
        name: place.displayName?.text ?? '',
        categoryName: place.primaryTypeDisplayName?.text ?? '',
        latitude,
        longitude,
        address: parsedAddress.address,
        city: parsedAddress.city,
        country: parsedAddress.country,
        type: 'google' as const,
    };
}
