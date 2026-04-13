<script lang="ts">
    import type {LooseObject} from '$lib/interfaces/object';
    import DeleteButton from '$lib/components/objectDetails/objectForm/deleteButton.svelte';
    import BackButton from '$lib/components/objectDetails/objectForm/backButton.svelte';
    import {removeSearchPoint} from '$lib/state/searchPointList.svelte.ts';
    import {superForm, defaults} from 'sveltekit-superforms';
    import {zod4Client} from 'sveltekit-superforms/adapters';
    import CategorySelect from '$lib/components/objectDetails/objectForm/categorySelect.svelte';
    import PrivateTagsSelect from '$lib/components/objectDetails/objectForm/privateTagsSelect.svelte';
    import TagsSelect from '$lib/components/objectDetails/objectForm/tagsSelect.svelte';
    import {toast} from 'svelte-sonner';
    import ImageUpload from '$lib/components/input/imageUpload/index.svelte';
    import {Button} from '$lib/components/ui/button';
    import {Input} from '$lib/components/ui/input';
    import {Separator} from '$lib/components/ui/separator';
    import {Checkbox} from '$lib/components/ui/checkbox';
    import {Textarea} from '$lib/components/ui/textarea';
    import {
        objectDetailsOverlay,
        showLoadingDetailsOverlay,
    } from '$lib/state/objectDetailsOverlay.svelte';
    import {getErrorArray} from '$lib/utils/formErrors.ts';
    import {
        FormField,
        FormControl,
        FormLabel,
        FormFieldErrors,
    } from '$lib/components/ui/form/index.js';
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {schema, toFormDefaults} from '$lib/schema/objectSchema.ts';
    import AddressLoadingIndicator from '$lib/components/objectDetails/objectForm/addressLoadingIndicator.svelte';
    import type {Id} from '$convex/_generated/dataModel';
    import {useConvexClient} from 'convex-svelte';
    import {api} from '$convex/_generated/api';
    import {resizeImage} from '$lib/utils/imageResizer';
    import {getActiveSearchUrl} from '$lib/state/search.svelte';

    interface Props {
        initialValues: Partial<LooseObject>;
    }

    const client = useConvexClient();

    let {initialValues}: Props = $props();
    let imageUrl: string | undefined = $derived(initialValues.cover?.url);
    let imagePreviewUrl: string | undefined = $derived(initialValues.cover?.previewUrl);

    let lastAction = '';
    let submitToastId: string | number | undefined;

    function getSubmitErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'object' && error !== null && 'message' in error) {
            return String((error as {message: unknown}).message);
        }
        if (typeof error === 'string') {
            return error;
        }
        return fallback;
    }

    function getFormData() {
        if (page.data.form) {
            return page.data.form;
        }

        return defaults(toFormDefaults(initialValues), zod4Client(schema));
    }

    const form = superForm(getFormData(), {
        validators: zod4Client(schema),
        invalidateAll: false,
        onSubmit: ({action}) => {
            lastAction = action.search.replace('?/', '');
            const loading = lastAction === 'delete' ? 'Удаляю...' : 'Сохраняю...';
            submitToastId = toast.loading(loading);
        },
        onResult: ({result}) => {
            if (submitToastId === undefined) {
                throw new Error('Не удалось получить информацию о процессе');
            }

            if (result.type === 'redirect') {
                toast.error('Пользователь не авторизован', {id: submitToastId});
                submitToastId = undefined;
                return;
            }

            if (result.type === 'failure') {
                toast.error('Что-то не так во введенных данных', {id: submitToastId});
                submitToastId = undefined;
                return;
            }

            if (result.type === 'success') {
                toast.success(lastAction === 'delete' ? 'Точка удалена!' : 'Точка сохранена!', {
                    id: submitToastId,
                });
                submitToastId = undefined;

                if (lastAction === 'delete' && result.data?.id) {
                    handleDeleteSuccess(result.data.id);
                }

                if (lastAction === 'save' && result.data?.id) {
                    handleSaveSuccess(result.data.id);
                }
                return;
            }
        },
        onError: ({result}) => {
            let message: string;
            switch (lastAction) {
                case 'save':
                    message = getSubmitErrorMessage(result.error, 'Не удалось сохранить точку');
                    break;
                case 'delete':
                    message = getSubmitErrorMessage(result.error, 'Не удалось удалить точку');
                    break;
                default:
                    message = getSubmitErrorMessage(result.error, 'Произошла ошибка');
            }

            if (submitToastId !== undefined) {
                toast.error(message, {id: submitToastId});
            } else {
                toast.error(message);
            }
            submitToastId = undefined;
        },
    });

    const {form: formData, errors, enhance, isTainted, submitting} = form;
    const addressFields = ['address', 'city', 'country'] as const;
    const lastAutoFilledAddress = $state<Record<(typeof addressFields)[number], string>>({
        address: '',
        city: '',
        country: '',
    });

    $effect(() => {
        for (const field of addressFields) {
            const incomingValue = initialValues[field];
            if (typeof incomingValue !== 'string' || !incomingValue) {
                continue;
            }

            const currentValue = $formData[field];
            const shouldApply =
                typeof currentValue !== 'string' ||
                !currentValue ||
                currentValue === lastAutoFilledAddress[field];

            if (!shouldApply || currentValue === incomingValue) {
                continue;
            }

            $formData[field] = incomingValue;
            lastAutoFilledAddress[field] = incomingValue;
        }
    });

    $effect(() => {
        if (isTainted() && !objectDetailsOverlay.isDirty) {
            objectDetailsOverlay.isDirty = true;
        }
    });

    function handleBack() {
        objectDetailsOverlay.isDirty = false;

        if ($formData.id) {
            objectDetailsOverlay.mode = 'objectView';
            return;
        }

        objectDetailsOverlay.mode = 'pointPreview';
    }

    function handleImageChange(file: File): Promise<void> {
        const uploadPromise = doImageChange(file);
        toast.promise(uploadPromise, {
            loading: 'Загружаю фото...',
            success: 'Фото загружено!',
            error: 'Не удалось загрузить фото',
        });

        return uploadPromise;
    }

    async function doImageChange(file: File) {
        const resizedFile = await resizeImage(file);
        const image = await uploadImage(resizedFile);

        $formData.cover = image.id;
        initialValues.cover = image;
    }

    async function uploadImage(file: File) {
        const uploadUrl = await client.mutation(api.images.generateUploadUrl, {});
        const result = await fetch(uploadUrl, {
            method: 'POST',
            headers: {'Content-Type': file.type},
            body: file,
        });
        const {storageId} = await result.json();
        return client.mutation(api.images.create, {storageId});
    }

    function handleSaveSuccess(id: Id<'objects'>) {
        if (objectDetailsOverlay.detailsId !== id) {
            // this was object creation case
            showLoadingDetailsOverlay(id);
            goto(`/object/${id}`);
        } else {
            objectDetailsOverlay.isDirty = false;
            objectDetailsOverlay.mode = 'objectView';
        }
    }

    function handleDeleteSuccess(id: string) {
        removeSearchPoint(id);

        goto(getActiveSearchUrl());
    }
</script>

<form method="POST" action="?/save" use:enhance>
    <div class="bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <Button type="submit" disabled={$submitting} class="px-6 text-base">Сохранить</Button>
        <BackButton isConfirmationRequired={isTainted()} onClick={handleBack} />
        <span class="flex-1"></span>
        {#if $formData.id}
            <DeleteButton disabled={$submitting} />
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
        <Input type="hidden" name="latitude" bind:value={$formData.latitude} />
        <Input type="hidden" name="longitude" bind:value={$formData.longitude} />

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
                                {#if objectDetailsOverlay.isAddressLoading}
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
                                {#if objectDetailsOverlay.isAddressLoading}
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
                                {#if objectDetailsOverlay.isAddressLoading}
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
