import {listObjectsDirect} from '$lib/api/object.ts';
import type {ObjectListItem} from '$lib/interfaces/object.ts';
import type {CurrentUser} from '$lib/interfaces/user.ts';
import type {LayoutLoad} from './$types';

interface LayoutData {
    user: CurrentUser;
    objects: ObjectListItem[];
}

export const load: LayoutLoad<LayoutData> = async ({fetch, parent}) => {
    const result: LayoutData = {user: {auth: false}, objects: []};
    const {user} = await parent();
    result.user = {auth: user.auth, profile: user.profile};
    if (!user.auth) {
        return result;
    }

    try {
        const objects = await listObjectsDirect({fetch});
        result.objects = objects.data.objects;
    } catch (error) {
        return result;
    }

    return result;
};
