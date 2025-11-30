import {changePassword} from '$lib/api/user.ts';
import RequestError from '$lib/errors/RequestError.ts';
import type {ChangePasswordResponsePayload} from '$lib/interfaces/user.ts';
import {type Actions, fail, isRedirect, redirect} from '@sveltejs/kit';
import {type ErrorStatus, message, setError, superValidate} from 'sveltekit-superforms';
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
            redirect(302, '/');
        } catch (error) {
            if (isRedirect(error)) {
                throw error;
            }

            if (error instanceof RequestError) {
                const payload = error.payload as ChangePasswordResponsePayload;
                if (payload.errors) {
                    for (const [key, value] of Object.entries(payload.errors)) {
                        if (value) {
                            setError(form, key as keyof typeof form.data, value);
                        }
                    }
                    return fail(error.status, {form});
                }
                return message(form, payload.message || 'Не удалось сменить пароль', {
                    status: error.status as ErrorStatus,
                });
            }

            return message(form, 'Не удалось сменить пароль', {status: 500});
        }
    },
};
