import {api} from '$convex/_generated/api.js';
import {schema} from '$lib/schema/objectSchema.ts';
import {getConvexClient} from '$lib/server/convexClient';
import {normalizeLatitude, normalizeLongitude} from '$lib/utils/coordinates.ts';
import {type Actions, error, fail, redirect} from '@sveltejs/kit';
import {superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';

export const load = async ({url, locals}) => {
    const {client, token} = await getConvexClient(locals);
    if (!token) {
        redirect(307, `/login?ref=${encodeURIComponent(url.pathname)}`);
    }

    const latitude = normalizeLatitude(url.searchParams.get('lat'));
    const longitude = normalizeLongitude(url.searchParams.get('lng'));
    if (latitude === null || longitude === null) {
        redirect(307, '/');
    }

    const address = client.action(api.locations.getAddress, {latitude, longitude});

    const form = await superValidate({latitude, longitude}, zod4(schema), {errors: false});

    return {
        streamed: {
            address,
        },
        form,
        isEdit: true,
    };
};

export const actions: Actions = {
    save: async ({request, url, locals}) => {
        const {client, token} = await getConvexClient(locals);
        if (!token) {
            redirect(307, `/login?ref=${encodeURIComponent(url.pathname)}`);
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
            return error(500, 'Не удалось сохранить точку');
        }
    },
};
