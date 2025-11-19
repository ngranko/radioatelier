import {meDirect} from '$lib/api/user.ts';
import type {CurrentUser} from '$lib/interfaces/user.ts';
import type {LayoutServerLoad} from './$types';

interface LayoutData {
    user: CurrentUser;
}

export const load: LayoutServerLoad<LayoutData> = async ({fetch}) => {
    const result: LayoutData = {user: {auth: false}};
    try {
        const user = await meDirect({fetch});
        result.user = {auth: true, profile: user.data};
    } catch (error) {
        console.error(error);
        return result;
    }

    return result;
};
