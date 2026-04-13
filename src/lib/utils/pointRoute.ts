interface PointRouteParams {
    latitude: number | string;
    longitude: number | string;
    placeId?: string | null;
}

export function buildPointUrl({latitude, longitude, placeId}: PointRouteParams): string {
    const searchParams = new URLSearchParams({
        lat: String(latitude),
        lng: String(longitude),
    });

    if (placeId) {
        searchParams.set('placeId', placeId);
    }

    return `/point?${searchParams.toString()}`;
}
