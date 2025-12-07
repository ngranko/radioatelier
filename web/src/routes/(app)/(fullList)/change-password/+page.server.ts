import {changePassword} from '$lib/api/user.ts';
import RequestError from '$lib/errors/RequestError.ts';
import type {ChangePasswordResponsePayload} from '$lib/interfaces/user.ts';
import {type Actions, error, fail, isRedirect, redirect} from '@sveltejs/kit';
import {setError, superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';
import {schema} from './schema.ts';

export const load = async () => {
    const form = await superValidate(zod4(schema));
    return {form};
};

export const actions: Actions = {
    default: async ({request, fetch}) => {
        const form = await superValidate(request, zod4(schema));

        if (!form.valid) {
            return fail(400, {form});
        }

        try {
            await changePassword(form.data, {fetch});
            redirect(303, '/');
        } catch (err) {
            if (isRedirect(err)) {
                throw err;
            }

            if (err instanceof RequestError) {
                const payload = err.payload as ChangePasswordResponsePayload;
                if (payload.errors) {
                    for (const [key, value] of Object.entries(payload.errors)) {
                        if (value) {
                            setError(form, key as keyof typeof form.data, value);
                        }
                    }
                    return fail(err.status, {form});
                }
                return error(err.status, payload.message || 'Не удалось сменить пароль');
            }

            return error(500, 'Не удалось сменить пароль');
        }
    },
};
