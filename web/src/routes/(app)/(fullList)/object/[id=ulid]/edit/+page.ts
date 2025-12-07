import {getReferenceData} from '$lib/cache/referenceData.ts';
import {schema} from '$lib/schema/objectSchema.ts';
import {redirect} from '@sveltejs/kit';
import {superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';
import type {PageLoad} from './$types';

export const load: PageLoad = async ({fetch, params, parent}) => {
    const {user, objects, activeObject} = await parent();
    // TODO: show different forms for owner and non-owner users
    if (!user.auth || !objects.find(o => o.id === activeObject!.id)) {
        redirect(303, `/object/${params.id}`);
    }

    if (!objects.find(o => o.id === activeObject.id)) {
        redirect(303, `/object/${params.id}`);
    }

    const initialValues = {
        ...activeObject,
        source: activeObject.source ?? '',
        category: activeObject.category?.id ?? '',
        tags: activeObject.tags?.map(tag => tag.id) ?? [],
        privateTags: activeObject.privateTags?.map(tag => tag.id) ?? [],
        cover: activeObject.cover?.id,
    };

    const [referenceData, form] = await Promise.all([
        getReferenceData(fetch),
        superValidate(initialValues, zod4(schema)),
    ]);

    return {
        user,
        objects,
        ...referenceData,
        form,
        isEdit: true,
    };
};
