<script lang="ts">
    import CategoryBadge from '$lib/components/categoryBadge.svelte';
    import ImageUpload from '$lib/components/input/imageUpload/index.svelte';
    import BackButton from '$lib/components/objectDetails/objectForm/backButton.svelte';
    import FlagToggle from '$lib/components/objectDetails/objectForm/flagToggle.svelte';
    import PrivateTagsSelect from '$lib/components/objectDetails/objectForm/privateTagsSelect.svelte';
    import Flags from '$lib/components/objectDetails/viewMode/flags.svelte';
    import {Button} from '$lib/components/ui/button';
    import {
        FormControl,
        FormDescription,
        FormField,
        FormFieldErrors,
        FormLabel,
    } from '$lib/components/ui/form';
    import {Separator} from '$lib/components/ui/separator';
    import type {LooseObject} from '$lib/interfaces/object';
    import {objectPersonalSchema, toPersonalFormDefaults} from '$lib/schema/objectPersonalSchema';
    import {returnToViewMode} from '$lib/state/objectDetailsOverlay.svelte';
    import {describeValidationFailure, getErrorArray} from '$lib/utils/formErrors';
    import {hasAnyFlag} from '$lib/utils/objectFlags';
    import UserCheckIcon from '@lucide/svelte/icons/user-check';
    import {onMount} from 'svelte';
    import {toast} from 'svelte-sonner';
    import {superForm, defaults} from 'sveltekit-superforms';
    import {zod4Client} from 'sveltekit-superforms/adapters';

    interface Props {
        initialValues: Partial<LooseObject>;
        registerCloseConfirmationCheck?: (check: () => boolean) => () => void;
    }

    let {initialValues, registerCloseConfirmationCheck}: Props = $props();
    const flags = $derived({
        isPublic: initialValues.isPublic ?? false,
        isVisited: initialValues.isVisited ?? false,
        isRemoved: initialValues.isRemoved ?? false,
    });

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

    // Editing starts from a snapshot so live updates cannot overwrite unsaved personal changes.
    // svelte-ignore state_referenced_locally
    const initialForm = defaults(
        toPersonalFormDefaults(initialValues),
        zod4Client(objectPersonalSchema),
    );
    const form = superForm(initialForm, {
        validators: zod4Client(objectPersonalSchema),
        invalidateAll: false,
        onSubmit: () => {
            submitToastId = toast.loading('Сохраняю...');
        },
        onResult: ({result}) => {
            if (result.type === 'redirect') {
                toast.error('Пользователь не авторизован', {id: submitToastId});
                submitToastId = undefined;
                return;
            }

            if (result.type === 'failure') {
                toast.error(describeValidationFailure(result.data?.form?.errors), {
                    id: submitToastId,
                });
                submitToastId = undefined;
                return;
            }

            if (result.type === 'success') {
                toast.success('Точка сохранена!', {id: submitToastId});
                submitToastId = undefined;
                handleSaveSuccess();
                return;
            }
        },
        onError: ({result}) => {
            const message = getSubmitErrorMessage(result.error, 'Не удалось сохранить точку');
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

    function handleSaveSuccess() {
        returnToViewMode();
    }

    function handleBack() {
        returnToViewMode();
    }
</script>

<form method="POST" action="?/savePersonal" class="flex min-h-0 flex-1 flex-col" use:enhance>
    <div class="bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <Button type="submit" disabled={$submitting} class="px-6 text-base">Сохранить</Button>
        <BackButton isConfirmationRequired={isTainted()} onClick={handleBack} />
    </div>
    <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
        <div class="mb-3">
            <ImageUpload
                onChange={() => {
                    /* do nothing */
                }}
                images={initialValues.images}
                categoryId={initialValues.category?.id}
                disabled
            />
        </div>
        {#if initialValues.category}
            <div class="flex">
                <CategoryBadge
                    name={initialValues.category.name}
                    categoryId={initialValues.category.id}
                />
            </div>
        {/if}
        <h1 class="text-foreground mb-3 text-2xl/tight font-semibold">
            {initialValues.name}
        </h1>
        {#if hasAnyFlag(flags)}
            <div class="mb-3 flex flex-wrap gap-2">
                <Flags {...flags} />
            </div>
        {/if}

        <div class="bg-muted/40 space-y-4 rounded-lg border p-4">
            <div class="flex flex-col items-start gap-1.5">
                <FlagToggle
                    name="isVisited"
                    label="посещена"
                    icon={UserCheckIcon}
                    bind:checked={$formData.isVisited}
                />
                <span class="text-muted-foreground text-xs">Отметка видна только вам</span>
            </div>

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
