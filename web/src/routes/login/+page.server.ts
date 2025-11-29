import {login} from '$lib/api/auth.ts';
import RequestError from '$lib/errors/RequestError';
import type {LoginResponsePayload} from '$lib/interfaces/auth';
import {fail, isRedirect, redirect} from '@sveltejs/kit';
import {type ErrorStatus, message, setError, superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';
import type {Actions, PageServerLoad} from './$types';
import {loginSchema} from './schema';

export const load: PageServerLoad = async () => {
    const form = await superValidate(zod4(loginSchema));
    return {form};
};

export const actions: Actions = {
    default: async ({request, fetch, url}) => {
        const form = await superValidate(request, zod4(loginSchema));

        if (!form.valid) {
            return fail(400, {form});
        }

        try {
            await login(form.data, {fetch});
            const ref = url.searchParams.get('ref');
            redirect(302, ref ?? '/');
        } catch (error) {
            if (isRedirect(error)) {
                throw error;
            }

            if (error instanceof RequestError) {
                const payload = error.payload as LoginResponsePayload;
                if (payload.errors) {
                    for (const [key, value] of Object.entries(payload.errors)) {
                        if (value) {
                            setError(form, key as keyof typeof form.data, value);
                        }
                    }
                    return fail(error.status, {form});
                }
                return message(form, payload.message || 'Вход не удался', {
                    status: error.status as ErrorStatus,
                });
            }

            return message(form, 'Вход не удался', {status: 500});
        }
    },
};
