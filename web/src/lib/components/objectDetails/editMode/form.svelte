<script lang="ts">
    import type {
        ListObjectsResponsePayload,
        LooseObject,
        Object,
        UpdateObjectResponsePayload,
    } from '$lib/interfaces/object';
    import DeleteButton from '$lib/components/objectDetails/editMode/deleteButton.svelte';
    import BackButton from '$lib/components/objectDetails/editMode/backButton.svelte';
    import {pointList, searchPointList} from '$lib/stores/map';
    import {defaults, superForm} from 'sveltekit-superforms';
    import {zod4, zod4Client} from 'sveltekit-superforms/adapters';
    import {z} from 'zod';
    import CategorySelect from '$lib/components/objectDetails/editMode/categorySelect.svelte';
    import PrivateTagsSelect from '$lib/components/objectDetails/editMode/privateTagsSelect.svelte';
    import TagsSelect from '$lib/components/objectDetails/editMode/tagsSelect.svelte';
    import {toast} from 'svelte-sonner';
    import {createMutation, useQueryClient} from '@tanstack/svelte-query';
    import {createObject, deleteObject, updateObject} from '$lib/api/object';
    import type {Payload} from '$lib/interfaces/api';
    import RequestError from '$lib/errors/RequestError';
    import ImageUpload from '$lib/components/input/imageUpload.svelte';
    import {Button} from '$lib/components/ui/button';
    import {Input} from '$lib/components/ui/input';
    import {Separator} from '$lib/components/ui/separator';
    import {Checkbox} from '$lib/components/ui/checkbox';
    import {Textarea} from '$lib/components/ui/textarea';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {getErrorArray, normalizeFormErrors} from '$lib/utils/formErrors.ts';
    import {
        FormField,
        FormControl,
        FormLabel,
        FormFieldErrors,
    } from '$lib/components/ui/form/index.js';
    import {uploadImage} from '$lib/api/image.ts';
    import {page} from '$app/state';
    import {goto} from '$app/navigation';

    const client = useQueryClient();

    interface Props {
        initialValues: Partial<LooseObject>;
    }

    interface ErrorPayload {
        errors: Record<string, string>;
    }

    let {initialValues}: Props = $props();
    let imageUrl: string | undefined = $derived(initialValues.cover?.url);
    let imagePreviewUrl: string | undefined = $state(initialValues.cover?.previewUrl);

    const inValues: ObjectFormInputs = $derived({
        ...(initialValues as Object),
        source: initialValues.source ?? '',
        category: initialValues.category?.id ?? '',
        tags: initialValues.tags?.map(tag => tag.id) ?? [],
        privateTags: initialValues.privateTags?.map(tag => tag.id) ?? [],
        cover: initialValues.cover?.id,
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

    const schema = z.object({
        id: z.string().optional().nullable(),
        lat: z.string().min(1),
        lng: z.string().min(1),
        cover: z.string().optional(),
        isPublic: z.boolean(),
        isVisited: z.boolean(),
        name: z
            .string()
            .min(1, 'Пожалуйста, введите название')
            .max(255, 'Слишком длинное название'),
        description: z.string().optional(),
        category: z.string().min(1, 'Нужно выбрать категорию'),
        tags: z.array(z.string()),
        privateTags: z.array(z.string()),
        address: z.string().max(128, 'Слишком длинный адрес').optional(),
        city: z.string().max(64, 'Слишком длинное название города').optional(),
        country: z.string().max(64, 'Слишком длинное название страны').optional(),
        installedPeriod: z.string().max(20, 'Слишком длинный период создания').optional(),
        isRemoved: z.boolean(),
        removalPeriod: z.string().max(20, 'Слишком длинный период утраты').optional(),
        source: z.url('Должна быть валидной ссылкой').or(z.literal('')),
    });

    type ObjectFormInputs = z.infer<typeof schema>;

    const form = superForm<ObjectFormInputs>(defaults(inValues, zod4(schema)), {
        SPA: true,
        validators: zod4Client(schema),
        onUpdate: async ({form}) => {
            if (!form.valid) {
                return;
            }

            try {
                await handleSave(form.data);
            } catch (error) {
                if (error instanceof RequestError && (error.payload as ErrorPayload).errors) {
                    form.valid = false;
                    const formErrors = (error.payload as Payload).errors;
                    if (formErrors) {
                        form.errors = normalizeFormErrors(formErrors, form.data);
                    }
                } else {
                    console.log(error);
                }
            }
        },
    });

    const {form: formData, errors, enhance, isTainted, submitting} = form;

    $effect(() => {
        if (isTainted() && !activeObject.isDirty) {
            activeObject.isDirty = true;
        }
    });

    function handleCategoryChange(category: string) {
        $formData.category = category;
    }

    function handleTagsChange(items: string[]) {
        $formData.tags = items;
    }

    function handlePrivateTagsChange(items: string[]) {
        $formData.privateTags = items;
    }

    async function handleSave(values: ObjectFormInputs) {
        console.log('saving');

        if (!activeObject.object) {
            console.log('quitting without saving');
            return;
        }

        if (!values.id) {
            const promise = createNewObject(values);
            toast.promise(promise, {
                loading: 'Создаю...',
                success: 'Точка создана!',
                error: 'Не удалось создать точку',
            });
            await promise;
        } else {
            const promise = updateExistingObject(values);
            toast.promise(promise, {
                loading: 'Обновляю...',
                success: 'Точка обновлена!',
                error: 'Не удалось обновить точку',
            });
            await promise;
        }
    }

    async function createNewObject(object: ObjectFormInputs) {
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

        await goto(`/object/${result.data.id}`);
    }

    async function updateExistingObject(object: ObjectFormInputs) {
        const result = await $updateObjectMutation.mutateAsync({
            id: object.id as string,
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

        await goto(`/object/${result.data.id}`);
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
        goto('/');
    }

    function handleBack() {
        form.reset();
        activeObject.isEditing = false;
        activeObject.isDirty = false;
    }

    function handleImageChange(file: File) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        toast.promise(
            $image.mutateAsync({formData: uploadFormData}).then(result => {
                $formData.cover = result.data.id;
                imageUrl = result.data.url;
                imagePreviewUrl = result.data.previewUrl;
            }),
            {
                loading: 'Загружаю...',
                success: 'Фото загружено!',
                error: 'Не удалось загрузить фото',
            },
        );
    }
</script>

<form use:enhance>
    <div class="flex items-center justify-between gap-3 border-b bg-gray-50/50 px-4 py-2.5">
        <Button type="submit" disabled={$submitting} class="px-6 text-base">Сохранить</Button>
        {#if inValues.id}
            <BackButton isConfirmationRequired={isTainted()} onClick={handleBack} />
            <span class="flex-1"></span>
            <DeleteButton onClick={handleDelete} />
        {/if}
    </div>
    <div class="h-[calc(100vh-8px*2-57px*2)] overflow-x-hidden overflow-y-auto p-4">
        <FormField {form} name="cover" class="mb-6">
            <FormControl>
                {#snippet children({props})}
                    <ImageUpload
                        {...props}
                        bind:value={$formData.cover}
                        bind:url={imageUrl}
                        bind:previewUrl={imagePreviewUrl}
                        disabled={$submitting}
                        onChange={handleImageChange}
                    />
                {/snippet}
            </FormControl>
            <FormFieldErrors />
        </FormField>

        <Input type="hidden" name="id" bind:value={$formData.id} />
        <Input type="hidden" name="lat" bind:value={$formData.lat} />
        <Input type="hidden" name="lng" bind:value={$formData.lng} />

        <div class="grid flex-1 grid-cols-2 content-start gap-x-4 gap-y-3">
            <FormField {form} name="name" class="col-span-full">
                <FormControl>
                    {#snippet children({props})}
                        <div class="space-y-1">
                            <FormLabel>название</FormLabel>
                            <Input
                                type="text"
                                {...props}
                                bind:value={$formData.name}
                                data-1p-ignore
                            />
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>

            <Separator class="col-span-full mt-2" />

            <FormField {form} name="isVisited" class="space-y-0">
                <FormControl>
                    {#snippet children({props})}
                        <div class="flex items-center space-x-2">
                            <Checkbox {...props} bind:checked={$formData.isVisited} />
                            <FormLabel class="mb-0">посещена</FormLabel>
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>
            <FormField {form} name="isRemoved" class="space-y-0">
                <FormControl>
                    {#snippet children({props})}
                        <div class="flex items-center space-x-2">
                            <Checkbox {...props} bind:checked={$formData.isRemoved} />
                            <FormLabel class="mb-0">утрачена</FormLabel>
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>
            <FormField {form} name="isPublic" class="space-y-0">
                <FormControl>
                    {#snippet children({props})}
                        <div class="flex items-center space-x-2">
                            <Checkbox {...props} bind:checked={$formData.isPublic} />
                            <FormLabel class="mb-0">публичная</FormLabel>
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>

            <Separator class="col-span-full mt-2" />

            <FormField {form} name="category" class="col-span-full">
                <FormControl>
                    {#snippet children({props})}
                        <div class="space-y-1">
                            <FormLabel>категория</FormLabel>
                            <CategorySelect
                                {...props}
                                value={$formData.category ?? ''}
                                onChange={handleCategoryChange}
                                error={getErrorArray($errors.category)}
                            />
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>
            <FormField {form} name="tags" class="col-span-full">
                <FormControl>
                    {#snippet children({props})}
                        <div class="space-y-1">
                            <FormLabel>теги</FormLabel>
                            <TagsSelect
                                {...props}
                                value={$formData.tags ?? []}
                                error={getErrorArray($errors.tags)}
                                onChange={handleTagsChange}
                            />
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>
            <FormField {form} name="privateTags" class="col-span-full">
                <FormControl>
                    {#snippet children({props})}
                        <div class="space-y-1">
                            <FormLabel>приватные теги</FormLabel>
                            <PrivateTagsSelect
                                {...props}
                                value={$formData.privateTags ?? []}
                                error={getErrorArray($errors.privateTags)}
                                onChange={handlePrivateTagsChange}
                            />
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>

            <Separator class="col-span-full mt-2" />

            <FormField {form} name="address" class="col-span-full">
                <FormControl>
                    {#snippet children({props})}
                        <div class="space-y-1">
                            <FormLabel>адрес</FormLabel>
                            <Input type="text" {...props} bind:value={$formData.address} />
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>
            <FormField {form} name="city" class="col-span-1">
                <FormControl>
                    {#snippet children({props})}
                        <div class="space-y-1">
                            <FormLabel>город</FormLabel>
                            <Input type="text" {...props} bind:value={$formData.city} />
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>
            <FormField {form} name="country" class="col-span-1">
                <FormControl>
                    {#snippet children({props})}
                        <div class="space-y-1">
                            <FormLabel>страна</FormLabel>
                            <Input type="text" {...props} bind:value={$formData.country} />
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>

            <Separator class="col-span-full mt-2" />

            <FormField {form} name="installedPeriod" class="col-span-1">
                <FormControl>
                    {#snippet children({props})}
                        <div class="space-y-1">
                            <FormLabel>период создания</FormLabel>
                            <Input type="text" {...props} bind:value={$formData.installedPeriod} />
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>
            {#if $formData.isRemoved}
                <FormField {form} name="removalPeriod" class="col-span-1">
                    <FormControl>
                        {#snippet children({props})}
                            <div class="space-y-1">
                                <FormLabel>период пропажи</FormLabel>
                                <Input
                                    type="text"
                                    {...props}
                                    bind:value={$formData.removalPeriod}
                                />
                            </div>
                        {/snippet}
                    </FormControl>
                    <FormFieldErrors />
                </FormField>
            {/if}

            <Separator class="col-span-full mt-2" />

            <FormField {form} name="description" class="col-span-full">
                <FormControl>
                    {#snippet children({props})}
                        <div class="space-y-1">
                            <FormLabel>информация</FormLabel>
                            <Textarea
                                {...props}
                                bind:value={$formData.description}
                                class="resize-y"
                            />
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>
            <FormField {form} name="source" class="col-span-full">
                <FormControl>
                    {#snippet children({props})}
                        <div class="space-y-1">
                            <FormLabel>ссылка на источник</FormLabel>
                            <Input type="text" {...props} bind:value={$formData.source} />
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>
        </div>
    </div>
</form>
