type AddressParts = {
    address: string | null;
    city: string | null;
    country: string | null;
};

export async function geocodeAddress(parts: AddressParts) {
    const query = [parts.address, parts.city, parts.country].filter(Boolean).join(', ');
    if (!query) {
        return null;
    }
    const apiKey = process.env.GOOGLE_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('Missing GOOGLE_API_KEY environment variable');
    }
    const controller = new AbortController();
    const timeoutMs = 5000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
        response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`,
            {signal: controller.signal},
        );
    } catch (error) {
        if (
            (error instanceof DOMException && error.name === 'AbortError') ||
            (error instanceof Error && error.name === 'AbortError')
        ) {
            return null;
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        return null;
    }
    const data = (await response.json()) as {
        status?: string;
        results?: Array<{geometry?: {location?: {lat?: number; lng?: number}}}>;
    };
    const location = data.results?.[0]?.geometry?.location;
    if (
        data.status !== 'OK' ||
        !Number.isFinite(location?.lat) ||
        !Number.isFinite(location?.lng)
    ) {
        return null;
    }
    return {
        latitude: Number(location?.lat),
        longitude: Number(location?.lng),
    };
}
