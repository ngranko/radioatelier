import {deleteObject, getObject, updateObjectDirect} from '$lib/api/object.ts';
import {me} from '$lib/api/user.ts';
import type {Payload} from '$lib/interfaces/api.ts';
import type {GetObjectResponsePayload, Object, UpdateObjectInputs} from '$lib/interfaces/object.ts';
import {schema} from '$lib/schema/objectSchema.ts';
import {type Actions, error, fail, redirect} from '@sveltejs/kit';
import {superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';

export const actions: Actions = {
    save: async ({request, fetch, params, url}) => {
        let object: Payload<GetObjectResponsePayload>;

        try {
            await me({fetch});
        } catch {
            redirect(303, `/login?ref=${encodeURIComponent(url.pathname)}`);
        }

        try {
            object = await getObject(params.id!, {fetch});
            if (!object.data.object.isPublic && !object.data.object.isOwner) {
                return error(403, 'Невозможно сохранить точку');
            }
        } catch (err) {
            console.error(err);
            return error(500, 'Не удалось сохранить точку');
        }

        const form = await superValidate(request, zod4(schema));

        if (!form.valid) {
            return fail(400, {form});
        }

        let updatedFields: UpdateObjectInputs['updatedFields'];
        if (!object.data.object.isOwner) {
            updatedFields = {
                name: object.data.object.name,
                description: object.data.object.description,
                cover: object.data.object.cover.id,
                isPublic: object.data.object.isPublic,
                isVisited: form.data.isVisited,
                isRemoved: object.data.object.isRemoved,
                category: object.data.object.category.id,
                tags: object.data.object.tags.map(item => item.id),
                privateTags: form.data.privateTags,
                address: object.data.object.address,
                city: object.data.object.city,
                country: object.data.object.country,
                installedPeriod: object.data.object.installedPeriod,
                removalPeriod: object.data.object.removalPeriod,
                source: object.data.object.source,
            };
        } else {
            updatedFields = {
                name: form.data.name,
                description: form.data.description,
                cover: form.data.cover,
                isPublic: form.data.isPublic,
                isVisited: form.data.isVisited,
                isRemoved: form.data.isRemoved,
                category: form.data.category,
                tags: form.data.tags,
                privateTags: form.data.privateTags,
                address: form.data.address,
                city: form.data.city,
                country: form.data.country,
                installedPeriod: form.data.installedPeriod,
                removalPeriod: form.data.removalPeriod,
                source: form.data.source,
            };
        }

        try {
            const result = await updateObjectDirect(
                {
                    id: params.id!,
                    updatedFields: prepareUpdatedFields(form.data, object.data.object),
                },
                {fetch},
            );

            return {form, object: result.data};
        } catch (err) {
            console.error('Failed to update object:', err);
            return error(500, 'Не удалось сохранить точку');
        }
    },
    delete: async ({request, fetch, params, url}) => {
        try {
            await me({fetch});
        } catch {
            redirect(303, `/login?ref=${encodeURIComponent(url.pathname)}`);
        }

        try {
            const object = await getObject(params.id!, {fetch});
            if (!object.data.object.isPublic && !object.data.object.isOwner) {
                return error(403, 'Невозможно удалить точку');
            }
        } catch (err) {
            console.error(err);
            return error(500, 'Не удалось удалить точку');
        }

        const form = await superValidate(request, zod4(schema));

        try {
            const result = await deleteObject({id: params.id!}, {fetch});
            return {form, id: result.data.id};
        } catch (err) {
            console.error('Failed to delete object:', err);
            return error(500, 'Не удалось удалить точку');
        }
    },
};

function prepareUpdatedFields(
    formData: Record<string, any>,
    currentObject: Object,
): UpdateObjectInputs['updatedFields'] {
    if (!currentObject.isOwner) {
        return {
            name: currentObject.name,
            description: currentObject.description,
            cover: currentObject.cover.id,
            isPublic: currentObject.isPublic,
            isVisited: formData.isVisited,
            isRemoved: currentObject.isRemoved,
            category: currentObject.category.id,
            tags: currentObject.tags.map(item => item.id),
            privateTags: formData.privateTags,
            address: currentObject.address,
            city: currentObject.city,
            country: currentObject.country,
            installedPeriod: currentObject.installedPeriod,
            removalPeriod: currentObject.removalPeriod,
            source: currentObject.source,
        };
    }

    return {
        name: formData.name,
        description: formData.description,
        cover: formData.cover,
        isPublic: formData.isPublic,
        isVisited: formData.isVisited,
        isRemoved: formData.isRemoved,
        category: formData.category,
        tags: formData.tags,
        privateTags: formData.privateTags,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        installedPeriod: formData.installedPeriod,
        removalPeriod: formData.removalPeriod,
        source: formData.source,
    };
}
