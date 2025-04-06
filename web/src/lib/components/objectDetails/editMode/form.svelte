<script lang="ts">
    import type {
        ListObjectsResponsePayload,
        LooseObject,
        Object,
        UpdateObjectResponsePayload,
    } from '$lib/interfaces/object';
    import PrimaryButton from '$lib/components/button/primaryButton.svelte';
    import DeleteButton from '$lib/components/objectDetails/editMode/deleteButton.svelte';
    import BackButton from '$lib/components/objectDetails/editMode/backButton.svelte';
    import {activeMarker, activeObjectInfo, markerList} from '$lib/stores/map';
    import {createForm} from 'felte';
    import * as yup from 'yup';
    import {validator} from '@felte/validator-yup';
    import CategorySelect from '$lib/components/objectDetails/editMode/categorySelect.svelte';
    import PrivateTagsSelect from '$lib/components/objectDetails/editMode/privateTagsSelect.svelte';
    import Checkbox from '$lib/components/input/checkbox.svelte';
    import FormInput from '$lib/components/form/formInput.svelte';
    import FormTextarea from '$lib/components/form/formTextarea.svelte';
    import FormSelect from '$lib/components/form/formSelect.svelte';
    import TagsSelect from '$lib/components/objectDetails/editMode/tagsSelect.svelte';
    import Switch from '$lib/components/input/switch.svelte';
    import toast from 'svelte-5-french-toast';
    import {createMutation, useQueryClient} from '@tanstack/svelte-query';
    import {createObject, deleteObject, updateObject} from '$lib/api/object';
    import type {Payload} from '$lib/interfaces/api';
    import RequestError from '$lib/errors/RequestError';
    import type {Category} from '$lib/interfaces/category';
    import type {Tag} from '$lib/interfaces/tag';

    const client = useQueryClient();

    interface Props {
        initialValues: Partial<LooseObject>;
    }

    interface ErrorPayload {
        errors: Record<string, string>;
    }

    interface Rating {
        value: string;
        text: string;
    }

    let {initialValues}: Props = $props();

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

    const schema = yup.object({
        id: yup.string().defined().nullable(),
        lat: yup.string().required(),
        lng: yup.string().required(),
        image: yup.string(),
        isPublic: yup.boolean().required(),
        isVisited: yup.boolean().required(),
        rating: yup.string().oneOf(['', '1', '2', '3']),
        name: yup
            .string()
            .required('Пожалуйста, введите название')
            .max(255, 'Слишком длинное название'),
        description: yup.string(),
        category: yup
            .object({id: yup.string().required('Пожалуйста, выберите категорию')})
            .required('Пожалуйста, выберите категорию'),
        tags: yup.array().required(),
        privateTags: yup.array().required(),
        address: yup.string().max(128, 'Слишком длинный адрес'),
        city: yup.string().max(64, 'Слишком длинное название города'),
        country: yup.string().max(64, 'Слишком длинное название страны'),
        installedPeriod: yup.string().max(20, 'Слишком длинный период создания'),
        isRemoved: yup.boolean().required(),
        removalPeriod: yup.string().max(20, 'Слишком длинный период утраты'),
        source: yup.string().url('Должна быть валидной ссылкой'),
    });

    const {form, data, errors, isSubmitting, reset, setData, isDirty, setIsDirty} = createForm<
        yup.InferType<typeof schema>
    >({
        onSubmit: (values: LooseObject) => {
            handleSave(values);
        },
        extend: validator({schema}),
        initialValues: initialValues,
    });

    let tags: Tag[] = $state([]);
    let privateTags: Tag[] = $state([]);

    $effect(() => {
        console.log(errors);
    });

    $effect(() => {
        if ($isDirty.valueOf()) {
            activeObjectInfo.update(value => ({...value, isDirty: true}));
        }
    });

    function getSelectedTagValues(items: Tag[], fallback?: Pick<Tag, 'id'>[]): string[] {
        if (items.length) {
            return items.map(item => item.id);
        }

        if (fallback) {
            return fallback.map(item => item.id);
        }

        return [];
    }

    function handleRatingChange(rating: Rating) {
        setData('rating', rating.value);
        setIsDirty(true);
    }

    function handleCategoryChange(category: Category) {
        setData('category', category);
        setIsDirty(true);
    }

    function handleTagsChange(items: Tag[]) {
        tags = items;
        setData('tags', tags);
        setIsDirty(true);
    }

    function handlePrivateTagsChange(items: Tag[]) {
        privateTags = items;
        setData('privateTags', privateTags);
        setIsDirty(true);
    }

    async function handleSave(values: LooseObject) {
        console.log('save');
        console.log(values);
        const object: LooseObject = {
            ...values,
            tags: tags.length ? tags : (initialValues.tags ?? []),
            privateTags: privateTags.length ? privateTags : (initialValues.privateTags ?? []),
        };

        if (!$activeObjectInfo.object) {
            return;
        }

        if (!values.id) {
            await toast.promise(createNewObject(object), {
                loading: 'Создаю...',
                success: 'Точка создана!',
                error: 'Не удалось создать точку',
            });
        } else {
            await toast.promise(updateExistingObject(object as Object), {
                loading: 'Обновляю...',
                success: 'Точка обновлена!',
                error: 'Не удалось обновить точку',
            });
        }
    }

    async function createNewObject(object: LooseObject) {
        try {
            const result = await $createObjectMutation.mutateAsync(object);
            client.setQueryData(['object', {id: result.data.id}], {
                message: '',
                data: {object: result.data},
            });
            markerList.addMarker(result.data);
            activeObjectInfo.reset();
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
            markerList.updateMarker(result.data.id, {
                isVisited: result.data.isVisited,
                isRemoved: result.data.isRemoved,
            });
            activeObjectInfo.reset();
        } catch (error: unknown) {
            if (error instanceof RequestError && (error.payload as ErrorPayload).errors) {
                errors.set((error.payload as ErrorPayload).errors);
            }
            throw error;
        }
    }

    async function handleDelete() {
        if (!$activeObjectInfo.object || !initialValues.id) {
            return;
        }

        await toast.promise(deleteExistingObject(initialValues.id), {
            loading: 'Удаляю...',
            success: 'Точка удалена!',
            error: 'Не удалось удалить точку',
        });
    }

    async function deleteExistingObject(id: string) {
        const result = await $deleteObjectMutation.mutateAsync({id});
        markerList.removeMarker(result.data.id);
        activeObjectInfo.reset();
        activeMarker.set(null);
    }

    function handleBack() {
        reset();
        activeObjectInfo.update(value => ({
            ...value,
            isEditing: false,
            isDirty: false,
        }));
    }
</script>

<form class="form" use:form>
    <input type="hidden" name="id" value={initialValues.id} />
    <input type="hidden" name="lat" value={initialValues.lat} />
    <input type="hidden" name="lng" value={initialValues.lng} />
    <input type="hidden" name="image" value={initialValues.image ?? ''} />

    <div class="fieldLong">
        <FormInput id="name" name="name" label="Название" error={$errors.name} />
    </div>
    <Checkbox id="isVisited" name="isVisited" checked={initialValues.isVisited} label="Посещена" />
    <FormSelect
        id="rating"
        name="rating"
        label="Рейтинг"
        placeholder="Выберите"
        options={[
            {value: '1', text: '⭐️'},
            {value: '2', text: '⭐⭐'},
            {value: '3', text: '🌟🌟🌟'},
        ]}
        onChange={handleRatingChange}
        error={$errors.rating}
    />
    <div class="fieldLong">
        <Switch id="isPublic" name="isPublic" checked={initialValues.isPublic} label="Публичная" />
    </div>
    <div class="fieldLong">
        <CategorySelect
            id="category"
            name="category"
            value={initialValues.category?.id ?? ''}
            onChange={handleCategoryChange}
            error={$errors.category?.id}
        />
    </div>
    <div class="fieldLong">
        <TagsSelect
            id="tags"
            name="tags"
            value={getSelectedTagValues(tags, initialValues.tags)}
            error={$errors.tags}
            onChange={handleTagsChange}
        />
    </div>
    <div class="fieldLong">
        <PrivateTagsSelect
            id="privateTags"
            name="privateTags"
            value={getSelectedTagValues(privateTags, initialValues.privateTags)}
            error={$errors.privateTags}
            onChange={handlePrivateTagsChange}
        />
    </div>
    <div class="fieldLong">
        <FormTextarea
            id="description"
            name="description"
            label="Информация"
            error={$errors.description}
        />
    </div>
    <div class="fieldLong">
        <FormInput id="address" name="address" label="Адрес" error={$errors.address} />
    </div>
    <div class="fieldLong">
        <FormInput id="city" name="city" label="Город" error={$errors.city} />
    </div>
    <div class="fieldLong">
        <FormInput id="country" name="country" label="Страна" error={$errors.country} />
    </div>
    <div class="fieldLong">
        <FormInput
            id="installedPeriod"
            name="installedPeriod"
            label="Период создания"
            error={$errors.installedPeriod}
        />
    </div>
    <div class="removedCheckbox">
        <Checkbox id="isRemoved" name="isRemoved" label="Утрачена" />
    </div>
    {#if $data.isRemoved}
        <div class="field">
            <FormInput
                id="removalPeriod"
                name="removalPeriod"
                label="Период пропажи"
                error={$errors.removalPeriod}
            />
        </div>
    {/if}
    <div class="fieldLong">
        <FormInput id="source" name="source" label="Ссылка на источник" error={$errors.source} />
    </div>
    <div class="actions">
        <div class="save-button">
            <PrimaryButton type="submit" disabled={$isSubmitting.valueOf()}>
                Сохранить
            </PrimaryButton>
        </div>
        {#if initialValues.id}
            <BackButton isConfirmationRequired={$isDirty.valueOf()} onClick={handleBack} />
            <span class="flexer"></span>
            <DeleteButton onClick={handleDelete} />
        {/if}
    </div>
</form>

<style lang="scss">
    @use '../../../../styles/colors';
    @use '../../../../styles/typography';

    .form {
        padding: 0 24px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-gap: 16px;
        align-content: flex-start;
        flex: 1;
    }

    .actions {
        position: sticky;
        display: flex;
        bottom: 0;
        padding-top: 8px;
        padding-bottom: 24px;
        border-top: 1px solid colors.$gray;
        background-color: white;
        grid-column: 1 / -1;
    }

    .save-button {
        margin-right: 8px;
    }

    .flexer {
        flex: 1;
    }

    .field {
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    .fieldLong {
        @extend .field;
        grid-column: 1 / -1;
    }

    .removedCheckbox {
        height: 62.1px;
        display: flex;
    }
</style>
