import {login} from '$lib/api/auth.ts';
import RequestError from '$lib/errors/RequestError';
import type {LoginResponsePayload} from '$lib/interfaces/auth';
import {error, fail, isRedirect, redirect} from '@sveltejs/kit';
import {setError, superValidate} from 'sveltekit-superforms';
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
            redirect(303, normalizeRef(url.searchParams.get('ref'), url.href));
        } catch (err) {
            if (isRedirect(err)) {
                throw err;
            }

            if (err instanceof RequestError) {
                const payload = err.payload as LoginResponsePayload;
                if (payload.errors) {
                    for (const [key, value] of Object.entries(payload.errors)) {
                        if (value) {
                            setError(form, key as keyof typeof form.data, value);
                        }
                    }
                    return fail(err.status, {form});
                }
                return error(err.status, payload.message || 'Вход не удался');
            }

            return error(500, 'Вход не удался');
        }
    },
};

function normalizeRef(value: string | null, base: string): string {
    if (!value) {
        return '/';
    }
    return new URL(value, base).pathname;
}
