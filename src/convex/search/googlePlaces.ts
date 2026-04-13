import {parseGoogleAddress} from '../utils/googleAddress';

type GooglePlaceSearchResponse = {
    places?: GooglePlace[];
    nextPageToken?: string;
};

type GooglePlace = {
    id?: string;
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
    googlePlaceId: string | null;
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
    'places.id',
    'places.displayName',
    'places.primaryTypeDisplayName',
    'places.formattedAddress',
    'places.addressComponents',
    'places.location',
    'nextPageToken',
].join(',');

const GOOGLE_PLACE_DETAILS_FIELD_MASK = [
    'id',
    'displayName',
    'primaryTypeDisplayName',
    'formattedAddress',
    'addressComponents',
    'location',
].join(',');

async function fetchGooglePlacesResource(
    url: string,
    fieldMask: string,
    init?: Omit<RequestInit, 'headers'> & {headers?: Record<string, string>},
): Promise<unknown | null> {
    const apiKey = process.env.GOOGLE_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('Missing GOOGLE_API_KEY environment variable');
    }

    const headers: Record<string, string> = {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
        ...init?.headers,
    };
    if (init?.body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...init,
        headers,
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Google Places request failed with status ${response.status}`);
    }

    return response.json();
}

export async function searchGooglePlaces(options: SearchOptions): Promise<GoogleSearchResults> {
    const data = (await fetchGooglePlacesResource(
        'https://places.googleapis.com/v1/places:searchText',
        GOOGLE_TEXT_SEARCH_FIELD_MASK,
        {
            method: 'POST',
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
        },
    )) as GooglePlaceSearchResponse | null;

    if (!data) {
        return {items: [], nextPageToken: ''};
    }

    return {
        items: (data.places ?? [])
            .map(toGoogleSearchItem)
            .filter((item): item is GoogleSearchItem => item !== null),
        nextPageToken: data.nextPageToken ?? '',
    };
}

export async function getGooglePlaceDetails(placeId: string): Promise<GoogleSearchItem | null> {
    const place = (await fetchGooglePlacesResource(
        `https://places.googleapis.com/v1/places/${placeId}`,
        GOOGLE_PLACE_DETAILS_FIELD_MASK,
    )) as GooglePlace | null;

    if (!place) {
        return null;
    }

    return toGoogleSearchItem(place);
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
        googlePlaceId: place.id ?? null,
    };
}
