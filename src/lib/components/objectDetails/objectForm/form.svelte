<script lang="ts">
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {api} from '$convex/_generated/api';
    import type {Id} from '$convex/_generated/dataModel';
    import ImageUpload from '$lib/components/input/imageUpload/index.svelte';
    import AddressLoadingIndicator from '$lib/components/objectDetails/objectForm/addressLoadingIndicator.svelte';
    import BackButton from '$lib/components/objectDetails/objectForm/backButton.svelte';
    import DeleteButton from '$lib/components/objectDetails/objectForm/deleteButton.svelte';
    import FlagToggle from '$lib/components/objectDetails/objectForm/flagToggle.svelte';
    import TaxonomyField from '$lib/components/objectDetails/objectForm/taxonomyField.svelte';
    import {Button} from '$lib/components/ui/button';
    import {
        FormField,
        FormControl,
        FormLabel,
        FormFieldErrors,
    } from '$lib/components/ui/form/index.js';
    import {Input} from '$lib/components/ui/input';
    import {Separator} from '$lib/components/ui/separator';
    import {Textarea} from '$lib/components/ui/textarea';
    import type {LooseObject} from '$lib/interfaces/object';
    import {schema, toFormDefaults} from '$lib/schema/objectSchema.ts';
    import {
        objectDetailsOverlay,
        returnToPointPreview,
        returnToViewMode,
        showLoadingDetailsOverlay,
    } from '$lib/state/objectDetailsOverlay.svelte';
    import {getActiveSearchUrl} from '$lib/state/search.svelte';
    import {removeSearchPoint, removeSearchPointsAt} from '$lib/state/searchPointList.svelte.ts';
    import {getErrorArray} from '$lib/utils/formErrors.ts';
    import {resizeImage} from '$lib/utils/imageResizer';
    import GhostIcon from '@lucide/svelte/icons/ghost';
    import LockOpenIcon from '@lucide/svelte/icons/lock-open';
    import PencilIcon from '@lucide/svelte/icons/pencil';
    import UserCheckIcon from '@lucide/svelte/icons/user-check';
    import {useConvexClient} from 'convex-svelte';
    import {onMount} from 'svelte';
    import {toast} from 'svelte-sonner';
    import {superForm, defaults} from 'sveltekit-superforms';
    import {zod4Client} from 'sveltekit-superforms/adapters';

    interface Props {
        initialValues: Partial<LooseObject>;
        registerCloseConfirmationCheck?: (check: () => boolean) => () => void;
    }

    const client = useConvexClient();

    let {initialValues, registerCloseConfirmationCheck}: Props = $props();
    // the form intentionally captures only the initial cover
    // svelte-ignore state_referenced_locally
    let imageUrl = $state(initialValues.cover?.url);
    // svelte-ignore state_referenced_locally
    let imagePreviewUrl = $state(initialValues.cover?.previewUrl);

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

    onMount(() => registerCloseConfirmationCheck?.(() => isTainted()) ?? undefined);

    let isAddressExpanded = $state(false);
    const resolvedAddress = $derived(
        [$formData.address, $formData.city, $formData.country].filter(Boolean).join(', '),
    );
    const isAddressCollapsed = $derived(
        !isAddressExpanded && Boolean(resolvedAddress) && !objectDetailsOverlay.isAddressLoading,
    );

    const addressFields = ['address', 'city', 'country'] as const;
    // Lookup is a one-shot for new points only; edit forms already have their values.
    let addressLookupApplied = $state(false);

    $effect(() => {
        if ($formData.id || addressLookupApplied) {
            return;
        }

        const userEnteredAddress = addressFields.some(field => {
            const value = $formData[field];
            return typeof value === 'string' && value.length > 0;
        });
        const hasLookupResult = addressFields.some(field => {
            const value = initialValues[field];
            return typeof value === 'string' && value.length > 0;
        });

        if (!hasLookupResult) {
            // page.data.form may already hold the looked-up address, or the user
            // started typing while lookup is still in flight — either way, stop waiting.
            if (userEnteredAddress) {
                addressLookupApplied = true;
            }
            return;
        }

        if (!userEnteredAddress) {
            for (const field of addressFields) {
                const value = initialValues[field];
                if (typeof value === 'string' && value) {
                    $formData[field] = value;
                }
            }
        }

        addressLookupApplied = true;
    });

    function handleBack() {
        if ($formData.id) {
            returnToViewMode();
            return;
        }

        returnToPointPreview();
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
        imageUrl = image.url;
        imagePreviewUrl = image.previewUrl;
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
            dropSavedPointPin();
            showLoadingDetailsOverlay(id);
            goto(`/object/${id}`);
        } else {
            returnToViewMode();
        }
    }

    // The saved place gets a marker of its own from the object list, so the
    // search pin it was created from would only stack a second one on the spot.
    function dropSavedPointPin() {
        const point = objectDetailsOverlay.pointDetails;
        if (!point) {
            return;
        }

        removeSearchPointsAt({lat: point.latitude, lng: point.longitude});
    }

    function handleDeleteSuccess(id: string) {
        removeSearchPoint(id);

        goto(getActiveSearchUrl());
    }
</script>

<form method="POST" action="?/save" class="flex min-h-0 flex-1 flex-col" use:enhance>
    <div class="bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <Button type="submit" disabled={$submitting} class="px-6 text-base">Сохранить</Button>
        <BackButton isConfirmationRequired={isTainted()} onClick={handleBack} />
        <span class="flex-1"></span>
        {#if $formData.id}
            <DeleteButton disabled={$submitting} />
        {/if}
    </div>
    <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
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

            <div class="col-span-full flex flex-wrap gap-2">
                <FlagToggle
                    name="isVisited"
                    label="посещена"
                    icon={UserCheckIcon}
                    bind:checked={$formData.isVisited}
                />
                <FlagToggle
                    name="isRemoved"
                    label="утрачена"
                    icon={GhostIcon}
                    bind:checked={$formData.isRemoved}
                />
                <FlagToggle
                    name="isPublic"
                    label="публичная"
                    icon={LockOpenIcon}
                    bind:checked={$formData.isPublic}
                />
            </div>

            <Separator class="col-span-full mt-2" />

            <FormField {form} name="category" class="col-span-full">
                <FormControl>
                    {#snippet children({props})}
                        <div class="space-y-1">
                            <FormLabel>категория и теги</FormLabel>
                            <TaxonomyField
                                {...props}
                                bind:category={$formData.category}
                                bind:tags={$formData.tags}
                                bind:privateTags={$formData.privateTags}
                                error={Boolean(getErrorArray($errors.category)?.length)}
                                disabled={$submitting}
                            />
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>

            <Separator class="col-span-full mt-2" />

            {#if isAddressCollapsed}
                <div class="col-span-full space-y-1">
                    <span class="flex items-center gap-2 text-sm leading-none">адрес</span>
                    <button
                        type="button"
                        onclick={() => (isAddressExpanded = true)}
                        class="flex w-full items-start gap-2 py-1 text-left"
                    >
                        <span class="min-w-0 flex-1 text-base break-words">{resolvedAddress}</span>
                        <PencilIcon class="text-muted-foreground mt-1 size-4 shrink-0" />
                    </button>
                </div>
                <input type="hidden" name="address" value={$formData.address ?? ''} />
                <input type="hidden" name="city" value={$formData.city ?? ''} />
                <input type="hidden" name="country" value={$formData.country ?? ''} />
            {:else}
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
            {/if}

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
