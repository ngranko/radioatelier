import {deleteObject, updateObjectDirect} from '$lib/api/object.ts';
import {me} from '$lib/api/user.ts';
import {schema} from '$lib/schema/objectSchema.ts';
import {type Actions, error, fail, redirect} from '@sveltejs/kit';
import {superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';

export const actions: Actions = {
    save: async ({request, fetch, params, url}) => {
        try {
            await me({fetch});
        } catch {
            redirect(303, `/login?ref=${encodeURIComponent(url.pathname)}`);
        }

        // TODO: add the edit availability check here

        const form = await superValidate(request, zod4(schema));

        if (!form.valid) {
            return fail(400, {form});
        }

        try {
            const result = await updateObjectDirect(
                {
                    id: params.id!,
                    updatedFields: {
                        name: form.data.name,
                        description: form.data.description,
                        cover: form.data.cover,
                        isPublic: form.data.isPublic,
                        isVisited: form.data.isVisited,
                        isRemoved: form.data.isRemoved,
                        category: form.data.category,
                        tags: form.data.tags,
                        privateTags: form.data.privateTags,
                        address: form.data.address,
                        city: form.data.city,
                        country: form.data.country,
                        installedPeriod: form.data.installedPeriod,
                        removalPeriod: form.data.removalPeriod,
                        source: form.data.source,
                    },
                },
                {fetch},
            );

            return {form, object: result.data};
        } catch (err) {
            console.error('Failed to update object:', err);
            return error(500, 'Не удалось сохранить точку');
        }
    },
    delete: async ({request, fetch, url}) => {
        try {
            await me({fetch});
        } catch {
            redirect(303, `/login?ref=${encodeURIComponent(url.pathname)}`);
        }

        // TODO: add the edit availability check here

        const form = await superValidate(request, zod4(schema));

        try {
            const result = await deleteObject({id: form.data.id!}, {fetch});
            return {form, id: result.data.id};
        } catch (err) {
            console.error('Failed to delete object:', err);
            return error(500, 'Не удалось удалить точку');
        }
    },
};
