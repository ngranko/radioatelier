import {api} from '$convex/_generated/api';
import type {Id} from '$convex/_generated/dataModel';
import {schema} from '$lib/schema/objectSchema.ts';
import {getConvexClient} from '$lib/server/convexClient';
import {type Actions, error, fail, redirect} from '@sveltejs/kit';
import {superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';

export const actions: Actions = {
    save: async ({request, params, url, locals}) => {
        const {client, token} = await getConvexClient(locals);
        if (!token) {
            redirect(307, `/login?ref=${encodeURIComponent(url.pathname)}`);
        }

        const form = await superValidate(request, zod4(schema));
        if (!form.valid) {
            return fail(400, {form});
        }

        const id = params.id as Id<'objects'>;
        const d = form.data;

        try {
            await client.mutation(api.objects.update, {
                id,
                data: {
                    name: d.name,
                    description: d.description,
                    coverId: d.cover,
                    categoryId: d.category,
                    tagIds: d.tags,
                    privateTags: d.privateTags,
                    isPublic: d.isPublic,
                    isVisited: d.isVisited,
                    isRemoved: d.isRemoved,
                    address: d.address,
                    city: d.city,
                    country: d.country,
                    installedPeriod: d.installedPeriod,
                    removalPeriod: d.removalPeriod,
                    source: d.source,
                },
            });
            return {form, id};
        } catch (err) {
            console.error('Failed to update object:', err);
            throw error(500, 'Не удалось сохранить точку');
        }
    },
    delete: async ({params, url, locals}) => {
        const {client, token} = await getConvexClient(locals);
        if (!token) {
            redirect(307, `/login?ref=${encodeURIComponent(url.pathname)}`);
        }

        const id = params.id as Id<'objects'>;
        try {
            await client.mutation(api.objects.remove, {id});
            return {id};
        } catch (err) {
            console.error('Failed to delete object:', err);
            throw error(500, 'Не удалось удалить точку');
        }
    },
};
