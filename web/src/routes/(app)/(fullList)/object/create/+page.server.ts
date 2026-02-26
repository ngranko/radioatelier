import {api} from '$convex/_generated/api.js';
import {getReferenceData} from '$lib/cache/referenceData';
import {schema} from '$lib/schema/objectSchema.ts';
import {getConvexClient} from '$lib/server/convexClient';
import {type Actions, error, fail, redirect} from '@sveltejs/kit';
import {superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';

export const load = async ({fetch, url, locals}) => {
    const {client, token} = await getConvexClient(locals);
    if (!token) {
        redirect(307, `/login?ref=${encodeURIComponent(url.pathname)}`);
    }

    const latitude = normalizeLattitude(url.searchParams.get('lat') ?? '');
    const longitude = normalizeLongitude(url.searchParams.get('lng') ?? '');

    const address = client.action(api.locations.getAddress, {latitude, longitude});

    const [referenceData, form] = await Promise.all([
        getReferenceData(fetch),
        superValidate({latitude, longitude}, zod4(schema), {errors: false}),
    ]);

    return {
        ...referenceData,
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

        try {
            const result = await client.mutation(api.objects.create, {data: form.data});
            return {form, object: result.data};
        } catch (err) {
            console.error('Failed to create object:', err);
            return error(500, 'Не удалось сохранить точку');
        }
    },
};

function normalizeLattitude(value: string): number {
    const normalizedValue = parseFloat(value);
    if (isFinite(normalizedValue) && Math.abs(normalizedValue) <= 90) {
        return normalizedValue;
    }
    redirect(307, '/');
}

function normalizeLongitude(value: string): number {
    const normalizedValue = parseFloat(value);
    if (isFinite(normalizedValue) && Math.abs(normalizedValue) <= 180) {
        return normalizedValue;
    }
    redirect(307, '/');
}
