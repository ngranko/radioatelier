import {listObjectsDirect} from '$lib/api/object.ts';
import {meDirect} from '$lib/api/user.ts';
import type {ObjectListItem} from '$lib/interfaces/object.ts';
import type {MeResponseData} from '$lib/interfaces/user.ts';
import type {LayoutLoad} from './$types';

interface LayoutData {
    user: {
        auth: boolean;
        profile?: MeResponseData;
    };
    objects: ObjectListItem[];
}

export const load: LayoutLoad<LayoutData> = async ({fetch}) => {
    const result: LayoutData = {user: {auth: false}, objects: []};
    try {
        const user = await meDirect({fetch});
        result.user = {auth: true, profile: user.data};
    } catch (error) {
        return result;
    }

    try {
        const objects = await listObjectsDirect({fetch});
        result.objects = objects.data.objects;
    } catch (error) {
        return result;
    }

    // TODO: add loading of concrete object in case of a share

    return result;
};
