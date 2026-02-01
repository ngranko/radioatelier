<script lang="ts">
    import type {LooseObject, Object} from '$lib/interfaces/object';
    import DeleteButton from '$lib/components/objectDetails/editMode/deleteButton.svelte';
    import BackButton from '$lib/components/objectDetails/editMode/backButton.svelte';
    import {searchPointList} from '$lib/stores/map';
    import {superForm, defaults} from 'sveltekit-superforms';
    import {zod4Client} from 'sveltekit-superforms/adapters';
    import CategorySelect from '$lib/components/objectDetails/editMode/categorySelect.svelte';
    import PrivateTagsSelect from '$lib/components/objectDetails/editMode/privateTagsSelect.svelte';
    import TagsSelect from '$lib/components/objectDetails/editMode/tagsSelect.svelte';
    import {toast} from 'svelte-sonner';
    import {createMutation} from '@tanstack/svelte-query';
    import ImageUpload from '$lib/components/input/imageUpload.svelte';
    import {Button} from '$lib/components/ui/button';
    import {Input} from '$lib/components/ui/input';
    import {Separator} from '$lib/components/ui/separator';
    import {Checkbox} from '$lib/components/ui/checkbox';
    import {Textarea} from '$lib/components/ui/textarea';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {getErrorArray} from '$lib/utils/formErrors.ts';
    import {
        FormField,
        FormControl,
        FormLabel,
        FormFieldErrors,
    } from '$lib/components/ui/form/index.js';
    import {uploadImage} from '$lib/api/image.ts';
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {schema} from '$lib/schema/objectSchema.ts';
    import {getObjectsContext} from '$lib/context/objects.ts';
    import AddressLoadingIndicator from '$lib/components/objectDetails/editMode/addressLoadingIndicator.svelte';

    const objectsCtx = getObjectsContext();

    interface Props {
        initialValues: Partial<LooseObject>;
    }

    let {initialValues}: Props = $props();
    let imageUrl: string | undefined = $derived(initialValues.cover?.url);
    let imagePreviewUrl: string | undefined = $state(initialValues.cover?.previewUrl);

    let lastAction = '';
    let deleteButton: HTMLButtonElement;
    let submitPromise: {resolve(value: unknown): void; reject(value?: unknown): void} | null = null;

    // During client-side navigation, page.data.form may be undefined
    // In that case, create form data from initialValues
    function getFormData() {
        if (page.data.form) {
            return page.data.form;
        }

        const formValues = {
            id: initialValues.id ?? null,
            lat: initialValues.lat ?? '',
            lng: initialValues.lng ?? '',
            name: initialValues.name ?? '',
            description: initialValues.description ?? '',
            isPublic: initialValues.isPublic ?? false,
            isVisited: initialValues.isVisited ?? false,
            isRemoved: initialValues.isRemoved ?? false,
            address: initialValues.address ?? '',
            city: initialValues.city ?? '',
            country: initialValues.country ?? '',
            installedPeriod: initialValues.installedPeriod ?? '',
            removalPeriod: initialValues.removalPeriod ?? '',
            source: initialValues.source ?? '',
            category: initialValues.category?.id ?? '',
            tags: initialValues.tags?.map(tag => tag.id) ?? [],
            privateTags: initialValues.privateTags?.map(tag => tag.id) ?? [],
            cover: initialValues.cover?.id,
        };

        return defaults(formValues, zod4Client(schema));
    }

    const form = superForm(getFormData(), {
        validators: zod4Client(schema),
        invalidateAll: false,
        onSubmit: ({action}) => {
            lastAction = action.search.replace('?/', '');
            const promise = new Promise((resolve, reject) => {
                submitPromise = {resolve, reject};
            });

            toast.promise(promise, {
                loading: lastAction === 'delete' ? 'Удаляю...' : 'Сохраняю...',
                success: lastAction === 'delete' ? 'Точка удалена!' : 'Точка сохранена!',
                error: err => {
                    console.log(err);
                    if (!err) {
                        return 'Произошла чудовищная ошибка';
                    }
                    return (err as Error).message;
                },
            });
        },
        onResult: ({result}) => {
            if (result.type === 'redirect') {
                submitPromise?.reject(new Error('Пользователь не авторизован'));
            }

            if (result.type === 'failure') {
                submitPromise?.reject(new Error('Что-то не так во введенных данных'));
            }

            if (result.type === 'success') {
                submitPromise?.resolve(null);

                if (lastAction === 'delete' && result.data?.id) {
                    handleDeleteSuccess(result.data.id);
                }

                if (lastAction === 'save' && result.data?.object) {
                    handleSaveSuccess(result.data.object);
                }
            }

            submitPromise = null;
        },
        onError: ({result}) => {
            switch (lastAction) {
                case 'save':
                    submitPromise?.reject(result.error ?? new Error('Не удалось сохранить точку'));
                    break;
                case 'delete':
                    submitPromise?.reject(result.error ?? new Error('Не удалось удалить точку'));
                    break;
                default:
                    submitPromise?.reject(result.error ?? new Error('Произошла ошибка'));
            }
            submitPromise = null;
        },
    });

    const image = createMutation({
        mutationFn: uploadImage,
    });

    const {form: formData, errors, enhance, isTainted, submitting} = form;

    $effect(() => {
        if (isTainted() && !activeObject.isDirty) {
            activeObject.isDirty = true;
        }
    });

    $effect(() => {
        if (!activeObject.addressLoading && activeObject.object) {
            const obj = activeObject.object;
            if (!$formData.address && obj.address) {
                $formData.address = obj.address;
            }
            if (!$formData.city && obj.city) {
                $formData.city = obj.city;
            }
            if (!$formData.country && obj.country) {
                $formData.country = obj.country;
            }
        }
    });

    function handleDelete() {
        deleteButton.click();
    }

    function handleBack() {
        goto(`/object/${$formData.id}`);
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

    function handleSaveSuccess(updated: Object) {
        const updatedListItem = {
            id: updated.id,
            lat: updated.lat,
            lng: updated.lng,
            isRemoved: updated.isRemoved,
            isVisited: updated.isVisited,
            isOwner: updated.isOwner,
        };
        if (objectsCtx.items.find(o => o.id === updated.id)) {
            objectsCtx.update(updated.id, updatedListItem);
        } else {
            objectsCtx.add(updatedListItem);
        }

        activeObject.object = updated;

        searchPointList.update(updated.id, {
            object: {
                id: updated.id,
                name: updated.name,
                lat: updated.lat,
                lng: updated.lng,
                categoryName: updated.category?.name ?? '',
                address: updated.address,
                city: updated.city,
                country: updated.country,
                type: 'local',
            },
        });

        goto(`/object/${updated.id}`);
    }

    function handleDeleteSuccess(id: string) {
        objectsCtx.remove(id);
        searchPointList.remove(id);

        goto('/');
    }
</script>

<form method="POST" action="?/save" use:enhance>
    <button
        type="submit"
        formaction="?/delete"
        hidden
        bind:this={deleteButton}
        aria-label="Удалить"
    ></button>
    <div class="flex items-center justify-between gap-3 border-b bg-gray-50/50 px-4 py-2.5">
        <Button type="submit" disabled={$submitting} class="px-6 text-base">Сохранить</Button>
        {#if $formData.id}
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
                                bind:value={$formData.category}
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
                                bind:value={$formData.tags}
                                error={getErrorArray($errors.tags)}
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
                                bind:value={$formData.privateTags}
                                error={getErrorArray($errors.privateTags)}
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
                            <div class="relative">
                                <Input type="text" {...props} bind:value={$formData.address} />
                                {#if activeObject.addressLoading}
                                    <AddressLoadingIndicator />
                                {/if}
                            </div>
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
                            <div class="relative">
                                <Input type="text" {...props} bind:value={$formData.city} />
                                {#if activeObject.addressLoading}
                                    <AddressLoadingIndicator />
                                {/if}
                            </div>
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
                            <div class="relative">
                                <Input type="text" {...props} bind:value={$formData.country} />
                                {#if activeObject.addressLoading}
                                    <AddressLoadingIndicator />
                                {/if}
                            </div>
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
