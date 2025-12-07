import {createObject} from '$lib/api/object.ts';
import {me} from '$lib/api/user.ts';
import {schema} from '$lib/schema/objectSchema.ts';
import {type Actions, error, fail, redirect} from '@sveltejs/kit';
import {superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';

export const actions: Actions = {
    save: async ({request, fetch, url}) => {
        try {
            await me({fetch});
        } catch {
            redirect(303, `/login?ref=${encodeURIComponent(url.pathname)}`);
        }

        const form = await superValidate(request, zod4(schema));

        if (!form.valid) {
            return fail(400, {form});
        }

        try {
            const result = await createObject(form.data, {fetch});
            return {form, object: result.data};
        } catch (err) {
            console.error('Failed to create object:', err);
            return error(500, 'Не удалось сохранить точку');
        }
    },
};
