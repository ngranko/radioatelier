interface PointRouteParams {
    latitude: number | string;
    longitude: number | string;
    placeId?: string | null;
    captureId?: string | null;
}

export function buildPointUrl({latitude, longitude, placeId, captureId}: PointRouteParams): string {
    const searchParams = new URLSearchParams({
        lat: String(latitude),
        lng: String(longitude),
    });

    if (placeId) {
        searchParams.set('placeId', placeId);
    }
    // A failed photo capture handed over to the create form.
    if (captureId) {
        searchParams.set('capture', captureId);
    }

    return `/point?${searchParams.toString()}`;
}
