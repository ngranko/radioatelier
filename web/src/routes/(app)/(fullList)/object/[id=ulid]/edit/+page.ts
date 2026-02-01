import {browser} from '$app/environment';
import {getReferenceData} from '$lib/cache/referenceData.ts';
import {schema} from '$lib/schema/objectSchema.ts';
import {redirect} from '@sveltejs/kit';
import {superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';
import type {PageLoad} from './$types';

export const load: PageLoad = async ({fetch, params, parent}) => {
    const parentData = await parent();
    const {user, objects} = parentData;

    if (!user.auth) {
        redirect(303, `/object/${params.id}`);
    }

    // During client-side navigation, activeObject may be undefined (loading async)
    // In that case, defer authorization and form setup to the component
    if (!parentData.activeObject && browser) {
        const referenceData = await getReferenceData(fetch);
        return {
            user,
            objects,
            ...referenceData,
            form: undefined,
            isEdit: true,
        };
    }

    // SSR path or fallback
    const activeObject = parentData.activeObject;
    if (!activeObject) {
        // TODO: redirect to root?
        redirect(303, `/object/${params.id}`);
    }

    if (!(activeObject.isOwner || activeObject.isPublic)) {
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
