<script lang="ts">
    import type {
        ListObjectsResponsePayload,
        LooseObject,
        Object,
        UpdateObjectResponsePayload,
    } from '$lib/interfaces/object';
    import DeleteButton from '$lib/components/objectDetails/editMode/deleteButton.svelte';
    import BackButton from '$lib/components/objectDetails/editMode/backButton.svelte';
    import {activeMarker, pointList, searchPointList} from '$lib/stores/map';
    import {createForm} from 'felte';
    import * as zod from 'zod';
    import {validator} from '@felte/validator-zod';
    import CategorySelect from '$lib/components/objectDetails/editMode/categorySelect.svelte';
    import PrivateTagsSelect from '$lib/components/objectDetails/editMode/privateTagsSelect.svelte';
    import TagsSelect from '$lib/components/objectDetails/editMode/tagsSelect.svelte';
    import {toast} from 'svelte-sonner';
    import {createMutation, useQueryClient} from '@tanstack/svelte-query';
    import {createObject, deleteObject, updateObject, uploadImage} from '$lib/api/object';
    import type {Payload} from '$lib/interfaces/api';
    import RequestError from '$lib/errors/RequestError';
    import ImageUpload from '$lib/components/input/imageUpload.svelte';
    import {Button} from '$lib/components/ui/button';
    import {Input} from '$lib/components/ui/input';
    import ErrorableLabel from '$lib/components/errorableLabel.svelte';
    import {Separator} from '$lib/components/ui/separator';
    import {Checkbox} from '$lib/components/ui/checkbox';
    import {Textarea} from '$lib/components/ui/textarea';
    import {activeObject, resetActiveObject} from '$lib/state/activeObject.svelte.ts';

    const client = useQueryClient();

    interface Props {
        initialValues: Partial<LooseObject>;
    }

    interface ErrorPayload {
        errors: Record<string, string>;
    }

    let {initialValues}: Props = $props();
    let isSubmitting = $state(false);

    const inValues = $derived({
        ...initialValues,
        category: initialValues.category?.id ?? '',
        tags: initialValues.tags?.map(tag => tag.id) ?? [],
        privateTags: initialValues.privateTags?.map(tag => tag.id) ?? [],
    });

    const createObjectMutation = createMutation({
        mutationFn: createObject,
        onSuccess: ({data}) => {
            const cachedListValue: Payload<ListObjectsResponsePayload> | undefined =
                client.getQueryData(['objects']);
            if (cachedListValue) {
                client.setQueryData(['objects'], {
                    data: {objects: [...cachedListValue.data.objects, data]},
                });
            }
        },
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

    const deleteObjectMutation = createMutation({
        mutationFn: deleteObject,
        onSuccess: ({data}) => {
            const cachedValue: Payload<ListObjectsResponsePayload> | undefined =
                client.getQueryData(['objects']);
            if (cachedValue) {
                client.setQueryData(['objects'], {
                    data: {objects: cachedValue.data.objects.filter(item => item.id != data.id)},
                });
            }
        },
    });

    const image = createMutation({
        mutationFn: uploadImage,
    });

    const schema = zod.object({
        id: zod.string().nullable(),
        lat: zod.string().nonempty(),
        lng: zod.string().nonempty(),
        image: zod.string().optional(),
        isPublic: zod.boolean(),
        isVisited: zod.boolean(),
        name: zod
            .string()
            .nonempty('Пожалуйста, введите название')
            .max(255, 'Слишком длинное название'),
        description: zod.string().optional(),
        category: zod.string().nonempty('Нужно выбрать категорию'),
        tags: zod.array(zod.string()),
        privateTags: zod.array(zod.string()),
        address: zod.string().max(128, 'Слишком длинный адрес').optional(),
        city: zod.string().max(64, 'Слишком длинное название города').optional(),
        country: zod.string().max(64, 'Слишком длинное название страны').optional(),
        installedPeriod: zod.string().max(20, 'Слишком длинный период создания').optional(),
        isRemoved: zod.boolean(),
        removalPeriod: zod.string().max(20, 'Слишком длинный период утраты').optional(),
        source: zod.string().url('Должна быть валидной ссылкой').or(zod.literal('')),
    });

    const {form, data, errors, reset, setData, isDirty, setIsDirty} = createForm<
        zod.infer<typeof schema>
    >({
        onSubmit: async (values: LooseObject) => {
            isSubmitting = true;
            await handleSave(values);
            isSubmitting = false;
        },
        extend: validator({schema}),
        initialValues: inValues,
    });

    $effect(() => {
        if ($isDirty.valueOf() && !activeObject.isDirty) {
            activeObject.isDirty = true;
        }
    });

    function handleCategoryChange(category: string) {
        setData('category', category);
        setIsDirty(true);
    }

    function handleTagsChange(items: string[]) {
        setData('tags', items);
        setIsDirty(true);
    }

    function handlePrivateTagsChange(items: string[]) {
        setData('privateTags', items);
        setIsDirty(true);
    }

    async function handleSave(values: LooseObject) {
        const object: LooseObject = {
            ...values,
        };

        if (!activeObject.object) {
            return;
        }

        if (!values.id) {
            const promise = createNewObject(object);
            toast.promise(promise, {
                loading: 'Создаю...',
                success: 'Точка создана!',
                error: 'Не удалось создать точку',
            });
            await promise;
        } else {
            const promise = updateExistingObject(object as Object);
            toast.promise(promise, {
                loading: 'Обновляю...',
                success: 'Точка обновлена!',
                error: 'Не удалось обновить точку',
            });
            await promise;
        }
    }

    async function createNewObject(object: LooseObject) {
        try {
            const result = await $createObjectMutation.mutateAsync(object);
            client.setQueryData(['object', {id: result.data.id}], {
                message: '',
                data: {object: result.data},
            });
            pointList.add({object: result.data});

            activeObject.object = result.data;
            activeObject.detailsId = result.data.id;
            activeObject.isEditing = false;
            activeObject.isDirty = false;
        } catch (error) {
            if (error instanceof RequestError && (error.payload as ErrorPayload).errors) {
                errors.set((error.payload as ErrorPayload).errors);
            }
            throw error;
        }
    }

    async function updateExistingObject(object: Object) {
        try {
            const result = await $updateObjectMutation.mutateAsync({
                id: object.id,
                updatedFields: object,
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

    async function handleDelete() {
        if (!activeObject.object || !inValues.id) {
            return;
        }

        const promise = deleteExistingObject(inValues.id);
        toast.promise(promise, {
            loading: 'Удаляю...',
            success: 'Точка удалена!',
            error: 'Не удалось удалить точку',
        });
        await promise;
    }

    async function deleteExistingObject(id: string) {
        const result = await $deleteObjectMutation.mutateAsync({id});
        pointList.remove(result.data.id);
        searchPointList.remove(result.data.id);
        await client.invalidateQueries({
            queryKey: ['searchLocal'],
        });
        resetActiveObject();
        activeMarker.set(null);
    }

    function handleBack() {
        reset();
        activeObject.isEditing = false;
        activeObject.isDirty = false;
    }

    function handleImageChange(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        toast.promise(
            $image.mutateAsync({id: inValues.id as string, formData}).then(result => {
                $data.image = result.data.url;
            }),
            {
                loading: 'Загружаю...',
                success: 'Фото загружено!',
                error: 'Не удалось загрузить фото',
            },
        );
    }

    function handleIsVisitedChange() {
        $data.isVisited = !$data.isVisited;
    }

    function handleIsRemovedChange() {
        $data.isRemoved = !$data.isRemoved;
    }

    function handleIsPublicChange() {
        $data.isPublic = !$data.isPublic;
    }
</script>

<form use:form>
    <div class="flex items-center justify-between gap-3 border-b bg-gray-50/50 px-4 py-2.5">
        <Button type="submit" disabled={isSubmitting} class="px-6 text-base">Сохранить</Button>
        {#if inValues.id}
            <BackButton isConfirmationRequired={$isDirty.valueOf()} onClick={handleBack} />
            <span class="flex-1"></span>
            <DeleteButton onClick={handleDelete} />
        {/if}
    </div>
    <div class="h-[calc(100vh-8px*2-57px*2)] overflow-x-hidden overflow-y-auto p-4">
        <div class="mb-6">
            <ImageUpload name="image" bind:value={$data.image} onChange={handleImageChange} />
        </div>
        <Input type="hidden" name="id" value={inValues.id} />
        <Input type="hidden" name="lat" value={inValues.lat} />
        <Input type="hidden" name="lng" value={inValues.lng} />
        <div class="grid flex-1 grid-cols-2 content-start gap-x-4 gap-y-3">
            <div class="col-span-full">
                <ErrorableLabel for="name" class="mb-1" error={$errors.name}>
                    название
                </ErrorableLabel>
                <Input type="text" id="name" name="name" data-1p-ignore />
            </div>

            <Separator class="col-span-full mt-2" />

            <div class="flex items-center space-x-2">
                <Checkbox
                    id="isVisited"
                    name="isVisited"
                    value="1"
                    checked={inValues.isVisited}
                    onCheckedChange={handleIsVisitedChange}
                />
                <ErrorableLabel for="isVisited" error={$errors.isVisited}>посещена</ErrorableLabel>
            </div>
            <div class="flex items-center space-x-2">
                <Checkbox
                    id="isRemoved"
                    name="isRemoved"
                    value="1"
                    checked={inValues.isRemoved}
                    onCheckedChange={handleIsRemovedChange}
                />
                <ErrorableLabel for="isRemoved" error={$errors.isRemoved}>утрачена</ErrorableLabel>
            </div>
            <div class="flex items-center space-x-2">
                <Checkbox
                    id="isPublic"
                    name="isPublic"
                    value="1"
                    checked={inValues.isPublic}
                    onCheckedChange={handleIsPublicChange}
                />
                <ErrorableLabel for="isPublic" error={$errors.isPublic}>публичная</ErrorableLabel>
            </div>

            <Separator class="col-span-full mt-2" />

            <div class="col-span-full">
                <ErrorableLabel for="category" class="mb-1" error={$errors.category}>
                    категория
                </ErrorableLabel>
                <CategorySelect
                    name="category"
                    value={inValues.category ?? ''}
                    onChange={handleCategoryChange}
                    error={$errors.category}
                />
            </div>
            <div class="col-span-full">
                <ErrorableLabel for="tags" class="mb-1" error={$errors.tags}>теги</ErrorableLabel>
                <TagsSelect
                    name="tags"
                    value={inValues.tags ?? ''}
                    error={$errors.tags}
                    onChange={handleTagsChange}
                />
            </div>
            <div class="col-span-full">
                <ErrorableLabel for="tags" class="mb-1" error={$errors.privateTags}>
                    приватные теги
                </ErrorableLabel>
                <PrivateTagsSelect
                    name="privateTags"
                    value={inValues.privateTags ?? ''}
                    error={$errors.privateTags}
                    onChange={handlePrivateTagsChange}
                />
            </div>

            <Separator class="col-span-full mt-2" />

            <div class="col-span-full">
                <ErrorableLabel for="address" class="mb-1" error={$errors.address}>
                    адрес
                </ErrorableLabel>
                <Input type="text" id="address" name="address" />
            </div>
            <div class="col-span-1">
                <ErrorableLabel for="city" class="mb-1" error={$errors.city}>город</ErrorableLabel>
                <Input type="text" id="city" name="city" />
            </div>
            <div class="col-span-1">
                <ErrorableLabel for="country" class="mb-1" error={$errors.country}>
                    страна
                </ErrorableLabel>
                <Input type="text" id="country" name="country" />
            </div>

            <Separator class="col-span-full mt-2" />

            <div class="col-span-1">
                <ErrorableLabel for="installedPeriod" class="mb-1" error={$errors.installedPeriod}>
                    период создания
                </ErrorableLabel>
                <Input type="text" id="installedPeriod" name="installedPeriod" />
            </div>
            {#if $data.isRemoved}
                <div class="col-span-1">
                    <ErrorableLabel for="removalPeriod" class="mb-1" error={$errors.removalPeriod}>
                        период пропажи
                    </ErrorableLabel>
                    <Input type="text" id="removalPeriod" name="removalPeriod" />
                </div>
            {/if}

            <Separator class="col-span-full mt-2" />

            <div class="col-span-full">
                <ErrorableLabel for="description" class="mb-1" error={$errors.description}>
                    информация
                </ErrorableLabel>
                <Textarea id="description" name="description" class="resize-y" />
            </div>
            <div class="col-span-full">
                <ErrorableLabel for="source" class="mb-1" error={$errors.source}>
                    ссылка на источник
                </ErrorableLabel>
                <Input type="text" id="source" name="source" />
            </div>
        </div>
    </div>
</form>
