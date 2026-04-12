import {api} from '$convex/_generated/api.js';
import type {LooseObject, PointPreviewDetails} from '$lib/interfaces/object.ts';
import {schema, toFormDefaults} from '$lib/schema/objectSchema.ts';
import {getConvexClient} from '$lib/server/convexClient';
import {normalizeLatitude, normalizeLongitude} from '$lib/utils/coordinates.ts';
import {type Actions, error, fail, redirect} from '@sveltejs/kit';
import {superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';

export const load = async ({url, locals, isDataRequest}) => {
    const {client, token} = await getConvexClient(locals);
    if (!token) {
        const ref = `${url.pathname}${url.search}`;
        redirect(307, `/login?ref=${encodeURIComponent(ref)}`);
    }

    const latitude = normalizeLatitude(url.searchParams.get('lat'));
    const longitude = normalizeLongitude(url.searchParams.get('lng'));
    if (latitude === null || longitude === null) {
        redirect(307, '/');
    }

    const placeId = url.searchParams.get('placeId')?.trim() || null;

    const addressResult = placeId
        ? null
        : await client.action(api.locations.getAddress, {latitude, longitude}).catch(() => null);

    const placeResult = placeId
        ? await client.action(api.search.googlePlaceDetails, {placeId}).catch(() => null)
        : null;

    const preview = composePointPreview({
        latitude,
        longitude,
        placeId,
        addressResult,
        placeResult,
    });
    const draft = composePointDraft(preview);
    const form = await superValidate(toFormDefaults(draft), zod4(schema), {errors: false});

    return {
        form,
        isServerRequest: !isDataRequest,
        activePoint: {
            id: buildPointDetailsId(preview),
            draft,
            preview,
        },
    };
};

export const actions: Actions = {
    save: async ({request, url, locals}) => {
        const {client, token} = await getConvexClient(locals);
        if (!token) {
            const ref = `${url.pathname}${url.search}`;
            redirect(307, `/login?ref=${encodeURIComponent(ref)}`);
        }

        const form = await superValidate(request, zod4(schema));
        if (!form.valid) {
            return fail(400, {form});
        }

        const d = form.data;
        try {
            const id = await client.mutation(api.objects.create, {
                data: {
                    latitude: d.latitude,
                    longitude: d.longitude,
                    address: d.address ?? '',
                    city: d.city ?? '',
                    country: d.country ?? '',
                    name: d.name,
                    description: d.description ?? null,
                    installedPeriod: d.installedPeriod ?? null,
                    removalPeriod: d.removalPeriod ?? null,
                    source: d.source ?? null,
                    coverId: d.cover ?? null,
                    categoryId: d.category,
                    tagIds: d.tags,
                    isPublic: d.isPublic,
                    isRemoved: d.isRemoved,
                    privateTags: d.privateTags,
                    isVisited: d.isVisited,
                },
            });
            return {form, id};
        } catch (err) {
            console.error('Failed to create object:', err);
            throw error(500, 'Не удалось сохранить точку');
        }
    },
};

function composePointPreview({
    latitude,
    longitude,
    placeId,
    addressResult,
    placeResult,
}: {
    latitude: number;
    longitude: number;
    placeId: string | null;
    addressResult: {address?: string; city?: string; country?: string} | null;
    placeResult: {
        name: string;
        categoryName: string;
        address: string;
        city: string;
        country: string;
    } | null;
}): PointPreviewDetails {
    return {
        latitude,
        longitude,
        name: placeResult?.name ?? '',
        categoryName: placeResult?.categoryName ?? '',
        address: placeResult?.address || addressResult?.address || '',
        city: placeResult?.city || addressResult?.city || '',
        country: placeResult?.country || addressResult?.country || '',
        type: placeId ? 'google' : 'map',
        googlePlaceId: placeId,
    };
}

function composePointDraft(preview: PointPreviewDetails): Partial<LooseObject> {
    return {
        id: null,
        latitude: preview.latitude,
        longitude: preview.longitude,
        name: preview.name,
        address: preview.address,
        city: preview.city,
        country: preview.country,
        isVisited: false,
        isRemoved: false,
        isOwner: true,
        isPublic: false,
    };
}

function buildPointDetailsId(preview: PointPreviewDetails): string {
    return preview.googlePlaceId ?? `${preview.latitude},${preview.longitude}`;
}
