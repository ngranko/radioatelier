<script lang="ts">
    import type {
        LooseObject,
        Object,
        ObjectFormInputs,
        UpdateObjectResponsePayload,
    } from '$lib/interfaces/object';
    import {pointList, searchPointList} from '$lib/stores/map';
    import {defaults, superForm} from 'sveltekit-superforms';
    import {zod4, zod4Client} from 'sveltekit-superforms/adapters';
    import {z} from 'zod';
    import PrivateTagsSelect from '$lib/components/objectDetails/editMode/privateTagsSelect.svelte';
    import {toast} from 'svelte-sonner';
    import {createMutation, useQueryClient} from '@tanstack/svelte-query';
    import {updateObject} from '$lib/api/object';
    import type {Payload} from '$lib/interfaces/api';
    import RequestError from '$lib/errors/RequestError';
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
    import ImageUpload from '$lib/components/input/imageUpload.svelte';
    import Flags from '$lib/components/objectDetails/viewMode/flags.svelte';
    import {Separator} from '$lib/components/ui/separator';
    import {Input} from '$lib/components/ui/input';
    import {getErrorArray, normalizeFormErrors} from '$lib/utils/formErrors';

    const client = useQueryClient();

    interface Props {
        initialValues: Partial<LooseObject>;
    }

    interface ErrorPayload {
        errors: Record<string, string>;
    }

    let {initialValues}: Props = $props();

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

    const schema = z.object({
        id: z.string().min(1),
        isVisited: z.boolean(),
        privateTags: z.array(z.string()),
    });

    type LightFormInputs = z.infer<typeof schema>;

    const inValues: LightFormInputs = $derived({
        id: initialValues.id as string,
        isVisited: initialValues.isVisited ?? false,
        privateTags: initialValues.privateTags?.map(item => item.id) ?? [],
    });

    const form = superForm<LightFormInputs>(defaults(inValues, zod4(schema)), {
        SPA: true,
        validators: zod4Client(schema),
        onUpdate: async ({form}) => {
            if (form.valid) {
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
            }
        },
    });

    const {form: formData, errors, enhance, isTainted, submitting} = form;

    $effect(() => {
        if (isTainted() && !activeObject.isDirty) {
            activeObject.isDirty = true;
        }
    });

    function handlePrivateTagsChange(items: string[]) {
        $formData.privateTags = items;
    }

    async function handleSave(values: LightFormInputs) {
        if (!activeObject.object) {
            toast.warning('Точка не найдена');
            return;
        }

        const object: ObjectFormInputs = {
            ...(activeObject.object as Object),
            category: (activeObject.object as Object).category.id,
            tags: (activeObject.object as Object).tags.map(item => item.id),
            cover: (activeObject.object as Object).cover?.id,
            ...values,
        };

        const promise = updateExistingObject(object);
        toast.promise(promise, {
            loading: 'Обновляю...',
            success: 'Точка обновлена!',
            error: 'Не удалось обновить точку',
        });
        await promise;
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
                categoryName: result.data.category?.name ?? '',
                address: result.data.address,
                city: result.data.city,
                country: result.data.country,
                type: 'local',
            },
        });

        activeObject.object = result.data;
        activeObject.isEditing = false;
        activeObject.isDirty = false;
    }

    function handleBack() {
        form.reset();
        activeObject.isEditing = false;
        activeObject.isDirty = false;
    }
</script>

<form use:enhance>
    <div class="flex items-center justify-between gap-3 border-b bg-gray-50/50 px-4 py-2.5">
        <Button type="submit" disabled={$submitting} class="px-6 text-base">Сохранить</Button>
        <Button variant="ghost" class="px-4 text-base" onclick={handleBack}>Назад</Button>
    </div>
    <div class="h-[calc(100vh-8px*2-57px*2)] overflow-x-hidden overflow-y-auto p-4">
        <!-- Header (mirror of view mode) -->
        <div class="mb-6">
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

        <Input type="hidden" name="id" bind:value={$formData.id} />

        <div class="mb-2 flex items-center gap-2">
            <i class="fa-solid fa-user-pen text-sky-600"></i>
            <div class="text-sm font-semibold text-gray-800">Личные поля</div>
        </div>
        <div class="space-y-4 rounded-lg border bg-gray-50 p-4">
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
                                <FormDescription class="text-xs text-gray-500">
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
                                value={$formData.privateTags ?? []}
                                error={getErrorArray($errors.privateTags)}
                                onChange={handlePrivateTagsChange}
                            />
                        </div>
                    {/snippet}
                </FormControl>
                <FormDescription class="text-xs text-gray-500">
                    Теги видны только вам
                </FormDescription>
                <FormFieldErrors />
            </FormField>
        </div>
    </div>
</form>
