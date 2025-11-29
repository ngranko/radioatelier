import {getAddress} from '$lib/api/location.ts';
import {redirect} from '@sveltejs/kit';
import type {PageLoad} from './$types';

export const load: PageLoad = async ({fetch, parent, url}) => {
    const data = await parent();
    if (!data.user.auth) {
        redirect(302, `/login?ref=${encodeURIComponent(url.pathname)}`);
    }

    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    if (!lat || !lng) {
        redirect(302, '/');
    }

    try {
        const address = await getAddress({lat, lng}, {fetch});
        return {...data, address: address.data};
    } catch {
        return {...data, address: {address: '', city: '', country: ''}};
    }
};
