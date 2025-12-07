import {getReferenceData} from '$lib/cache/referenceData.ts';
import {getAddress} from '$lib/api/location.ts';
import {schema} from '$lib/schema/objectSchema.ts';
import {redirect} from '@sveltejs/kit';
import {superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';
import type {PageLoad} from './$types';

export const load: PageLoad = async ({fetch, parent, url}) => {
    const data = await parent();
    if (!data.user.auth) {
        redirect(303, `/login?ref=${encodeURIComponent(url.pathname)}`);
    }

    const lat = normalizeLattitude(url.searchParams.get('lat') ?? '');
    const lng = normalizeLongitude(url.searchParams.get('lng') ?? '');

    const [referenceData, addressResult] = await Promise.all([
        getReferenceData(fetch),
        getAddress({lat, lng}, {fetch}).catch(error => {
            console.error('Address retrieval failed:', error);
            return {data: {address: '', city: '', country: ''}};
        }),
    ]);

    const form = await superValidate(
        {lat, lng, ...addressResult.data},
        zod4(schema),
    );

    return {
        ...data,
        ...referenceData,
        address: addressResult.data,
        form,
        isEdit: true,
    };
};

function normalizeLattitude(value: string): string {
    const normalizedValue = parseFloat(value);
    if (isFinite(normalizedValue) && Math.abs(normalizedValue) <= 90) {
        return String(normalizedValue);
    }
    redirect(303, '/');
}

function normalizeLongitude(value: string): string {
    const normalizedValue = parseFloat(value);
    if (isFinite(normalizedValue) && Math.abs(normalizedValue) <= 180) {
        return String(normalizedValue);
    }
    redirect(303, '/');
}
