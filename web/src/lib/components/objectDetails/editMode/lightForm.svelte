<script lang="ts">
    import type {LooseObject, Object, UpdateObjectResponsePayload} from '$lib/interfaces/object';
    import {pointList, searchPointList} from '$lib/stores/map';
    import {createForm} from 'felte';
    import * as zod from 'zod';
    import {validator} from '@felte/validator-zod';
    import PrivateTagsSelect from '$lib/components/objectDetails/editMode/privateTagsSelect.svelte';
    import toast from 'svelte-5-french-toast';
    import {createMutation, useQueryClient} from '@tanstack/svelte-query';
    import {updateObject} from '$lib/api/object';
    import type {Payload} from '$lib/interfaces/api';
    import RequestError from '$lib/errors/RequestError';
    import type {FuzzyPrivateTag} from '$lib/interfaces/privateTag.ts';
    import {Button} from '$lib/components/ui/button';
    import {Checkbox} from '$lib/components/ui/checkbox';
    import ErrorableLabel from '$lib/components/errorableLabel.svelte';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import ImageUpload from '$lib/components/input/imageUpload.svelte';
    import Flags from '$lib/components/objectDetails/viewMode/flags.svelte';
    import {Separator} from '$lib/components/ui/separator';
    import {Input} from '$lib/components/ui/input';

    const client = useQueryClient();

    interface LightObject {
        id: string;
        isVisited: boolean;
        privateTags: FuzzyPrivateTag[];
    }

    interface Props {
        initialValues: Partial<LooseObject>;
    }

    interface ErrorPayload {
        errors: Record<string, string>;
    }

    let {initialValues}: Props = $props();
    let isSubmitting = $state(false);

    const inValues = $derived({
        id: initialValues.id,
        isVisited: initialValues.isVisited ?? false,
        privateTags: initialValues.privateTags?.map(item => item.id),
    });

    const updateObjectMutation = createMutation({
        mutationFn: updateObject,
        onSuccess: ({data}) => {
            const cachedValue: Payload<UpdateObjectResponsePayload> | undefined =
                client.getQueryData(['object', {id: data.id}]);
            if (cachedValue) {
                client.setQueryData(['object', {id: data.id}], {
                    data: {...cachedValue.data, ...data},
                });
            }
        },
    });

    const schema = zod.object({
        id: zod.string().nonempty(),
        isVisited: zod.boolean(),
        privateTags: zod.array(zod.string()),
    });

    const {form, data, errors, reset, setData, isDirty, setIsDirty} = createForm<
        zod.infer<typeof schema>
    >({
        onSubmit: async (values: LightObject) => {
            isSubmitting = true;
            await handleSave(values);
            isSubmitting = false;
        },
        extend: validator({schema}),
        initialValues: inValues,
    });

    $effect(() => {
        if ($isDirty.valueOf()) {
            activeObject.isDirty = true;
        }
    });

    function handlePrivateTagsChange(items: string[]) {
        setData('privateTags', items);
        setIsDirty(true);
    }

    async function handleSave(values: LightObject) {
        const object: LightObject = {
            ...values,
        };

        if (!activeObject.object) {
            return;
        }

        await toast.promise(updateExistingObject(object as Object), {
            loading: 'Обновляю...',
            success: 'Точка обновлена!',
            error: 'Не удалось обновить точку',
        });
    }

    async function updateExistingObject(object: LightObject) {
        try {
            const result = await $updateObjectMutation.mutateAsync({
                id: object.id,
                updatedFields: object as Object,
            });
            client.setQueryData(['object', {id: result.data.id}], {
                message: '',
                data: {object: result.data},
            });
            pointList.update(result.data.id, {object: result.data});
            searchPointList.update(result.data.id, {
                object: {
                    id: result.data.id,
                    name: result.data.name,
                    lat: result.data.lat,
                    lng: result.data.lng,
                    categoryName: result.data.category.name ?? '',
                    address: result.data.address,
                    city: result.data.city,
                    country: result.data.country,
                    type: 'local',
                },
            });

            activeObject.object = result.data;
            activeObject.isEditing = false;
            activeObject.isDirty = false;
        } catch (error: unknown) {
            if (error instanceof RequestError && (error.payload as ErrorPayload).errors) {
                errors.set((error.payload as ErrorPayload).errors);
            }
            throw error;
        }
    }

    function handleBack() {
        reset();
        activeObject.isEditing = false;
        activeObject.isDirty = false;
    }

    function handleIsVisitedChange() {
        $data.isVisited = !$data.isVisited;
    }
</script>

<form use:form>
    <div class="flex items-center justify-between gap-3 border-b bg-gray-50/50 px-4 py-2.5">
        <Button type="submit" disabled={isSubmitting} class="px-6 text-base">Сохранить</Button>
        <Button variant="ghost" class="px-4 text-base" onclick={handleBack}>Назад</Button>
    </div>
    <div class="h-[calc(100vh-8px*2-57px*2)] overflow-x-hidden overflow-y-auto p-4">
        <!-- Header (mirror of view mode) -->
        <div class="mb-6">
            <ImageUpload
                bind:value={initialValues.image}
                onChange={() => {
                    /* do nothing */
                }}
                disabled
            />
        </div>
        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">{initialValues.category?.name ?? ''}</div>
            <Flags
                isPublic={initialValues.isPublic ?? false}
                isVisited={initialValues.isVisited ?? false}
                isRemoved={initialValues.isRemoved ?? false}
            />
        </div>
        <h1 class="mb-3 text-2xl leading-tight font-semibold text-gray-900">
            {initialValues.name}
        </h1>

        <Input type="hidden" name="id" value={inValues.id} />

        <div class="mb-2 flex items-center gap-2">
            <i class="fa-solid fa-user-pen text-sky-600"></i>
            <div class="text-sm font-semibold text-gray-800">Личные поля</div>
        </div>
        <div class="rounded-lg border bg-gray-50 p-4">
            <div class="flex items-center gap-3">
                <Checkbox
                    id="isVisited"
                    name="isVisited"
                    value="1"
                    checked={initialValues.isVisited}
                    onCheckedChange={handleIsVisitedChange}
                />
                <div class="flex flex-col">
                    <ErrorableLabel for="isVisited" error={$errors.isVisited} class="mb-0">
                        посещена
                    </ErrorableLabel>
                    <div class="text-xs text-gray-500">Отметка видна только вам</div>
                </div>
            </div>

            <Separator class="my-4" />

            <div>
                <ErrorableLabel for="privateTags" class="mb-1" error={$errors.privateTags}>
                    приватные теги
                </ErrorableLabel>
                <PrivateTagsSelect
                    id="privateTags"
                    name="privateTags"
                    value={inValues.privateTags}
                    error={$errors.privateTags}
                    onChange={handlePrivateTagsChange}
                />
                <div class="mt-1 text-xs text-gray-500">Теги видны только вам</div>
            </div>
        </div>
    </div>
</form>
