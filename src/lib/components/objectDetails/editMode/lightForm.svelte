<script lang="ts">
    import type {LooseObject} from '$lib/interfaces/object';
    import {superForm, defaults} from 'sveltekit-superforms';
    import {zod4Client} from 'sveltekit-superforms/adapters';
    import PrivateTagsSelect from '$lib/components/objectDetails/editMode/privateTagsSelect.svelte';
    import {toast} from 'svelte-sonner';
    import {Button} from '$lib/components/ui/button';
    import {Checkbox} from '$lib/components/ui/checkbox';
    import {
        FormControl,
        FormDescription,
        FormField,
        FormFieldErrors,
        FormLabel,
    } from '$lib/components/ui/form';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import ImageUpload from '$lib/components/input/imageUpload/index.svelte';
    import Flags from '$lib/components/objectDetails/viewMode/flags.svelte';
    import {Separator} from '$lib/components/ui/separator';
    import {Input} from '$lib/components/ui/input';
    import {getErrorArray} from '$lib/utils/formErrors';
    import {page} from '$app/state';
    import {schema, toFormDefaults} from '$lib/schema/objectSchema.ts';
    import BackButton from '$lib/components/objectDetails/editMode/backButton.svelte';

    interface Props {
        initialValues: Partial<LooseObject>;
    }

    let {initialValues}: Props = $props();

    let submitPromise: {resolve(value: unknown): void; reject(value?: unknown): void} | null = null;

    // During client-side navigation, page.data.form may be undefined
    // In that case, create form data from initialValues
    function getFormData() {
        if (page.data.form) {
            return page.data.form;
        }
        return defaults(toFormDefaults(initialValues), zod4Client(schema));
    }

    const form = superForm(getFormData(), {
        validators: zod4Client(schema),
        invalidateAll: false,
        onSubmit: () => {
            const promise = new Promise((resolve, reject) => {
                submitPromise = {resolve, reject};
            });

            toast.promise(promise, {
                loading: 'Сохраняю...',
                success: 'Точка сохранена!',
                error: err => {
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

            if (result.type === 'success' && result.data?.id) {
                submitPromise?.resolve(null);
                handleSaveSuccess();
            }

            submitPromise = null;
        },
        onError: ({result}) => {
            submitPromise?.reject(result.error ?? new Error('Не удалось сохранить точку'));
            submitPromise = null;
        },
    });

    const {form: formData, errors, enhance, isTainted, submitting} = form;

    $effect(() => {
        if (isTainted() && !activeObject.isDirty) {
            activeObject.isDirty = true;
        }
    });

    function handleSaveSuccess() {
        activeObject.isEditing = false;
    }

    function handleBack() {
        activeObject.isEditing = false;
    }
</script>

<form method="POST" action="?/save" use:enhance>
    <div class="bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <Button type="submit" disabled={$submitting} class="px-6 text-base">Сохранить</Button>
        <BackButton isConfirmationRequired={isTainted()} onClick={handleBack} />
    </div>
    <div class="h-[calc(100vh-8px*2-57px*2)] overflow-x-hidden overflow-y-auto p-4">
        <div class="mb-3">
            <ImageUpload
                value={initialValues.cover?.id}
                onChange={() => {
                    /* do nothing */
                }}
                url={initialValues.cover?.url}
                previewUrl={initialValues.cover?.previewUrl}
                disabled
            />
        </div>
        <div class="flex items-center justify-between">
            <div class="text-muted-foreground text-sm">{initialValues.category?.name ?? ''}</div>
            <Flags
                isPublic={initialValues.isPublic ?? false}
                isVisited={initialValues.isVisited ?? false}
                isRemoved={initialValues.isRemoved ?? false}
            />
        </div>
        <h1 class="text-foreground mb-3 text-2xl leading-tight font-semibold">
            {initialValues.name}
        </h1>

        <Input type="hidden" name="id" bind:value={$formData.id} />
        <Input type="hidden" name="latitude" bind:value={$formData.latitude} />
        <Input type="hidden" name="longitude" bind:value={$formData.longitude} />
        <Input type="hidden" name="name" bind:value={$formData.name} />
        <Input type="hidden" name="category" bind:value={$formData.category} />
        <Input type="hidden" name="isPublic" value={$formData.isPublic ? 'on' : ''} />
        <Input type="hidden" name="isRemoved" value={$formData.isRemoved ? 'on' : ''} />
        <Input type="hidden" name="cover" bind:value={$formData.cover} />
        <Input type="hidden" name="description" bind:value={$formData.description} />
        <Input type="hidden" name="address" bind:value={$formData.address} />
        <Input type="hidden" name="city" bind:value={$formData.city} />
        <Input type="hidden" name="country" bind:value={$formData.country} />
        <Input type="hidden" name="installedPeriod" bind:value={$formData.installedPeriod} />
        <Input type="hidden" name="removalPeriod" bind:value={$formData.removalPeriod} />
        <Input type="hidden" name="source" bind:value={$formData.source} />
        {#each $formData.tags as tag (tag)}
            <Input type="hidden" name="tags" value={tag} />
        {/each}

        <div class="bg-muted/40 space-y-4 rounded-lg border p-4">
            <FormField {form} name="isVisited">
                <FormControl>
                    {#snippet children({props})}
                        <div class="flex items-center gap-3">
                            <Checkbox
                                {...props}
                                id="isVisited"
                                bind:checked={$formData.isVisited}
                            />
                            <div class="flex flex-col">
                                <FormLabel class="mb-0">посещена</FormLabel>
                                <FormDescription class="text-muted-foreground text-xs">
                                    Отметка видна только вам
                                </FormDescription>
                            </div>
                        </div>
                    {/snippet}
                </FormControl>
                <FormFieldErrors />
            </FormField>

            <Separator />

            <FormField {form} name="privateTags">
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
                <FormDescription class="text-muted-foreground text-xs">
                    Приватные теги видны только вам
                </FormDescription>
                <FormFieldErrors />
            </FormField>
        </div>
    </div>
</form>
