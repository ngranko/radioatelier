<script lang="ts">
    import {createEventDispatcher} from 'svelte';
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
    import toast from 'svelte-french-toast';
    import {createMutation, useQueryClient} from '@tanstack/svelte-query';
    import {createObject, deleteObject, updateObject} from '$lib/api/object';
    import type {Payload} from '$lib/interfaces/api';
    import RequestError from '$lib/errors/RequestError';

    const client = useQueryClient();
    const dispatch = createEventDispatcher();

    export let initialValues: Partial<LooseObject>;

    let tags = initialValues.tags?.map(item => item.id) ?? [];
    let privateTags = initialValues.privateTags?.map(item => item.id) ?? [];

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
        name: yup
            .string()
            .required('Пожалуйста, введите название')
            .max(255, 'Слишком длинное название'),
        category: yup.string().required('Пожалуйста, выберите категорию'),
        address: yup.string().nullable().max(128, 'Слишком длинный адрес'),
        city: yup.string().nullable().max(64, 'Слишком длинное название города'),
        country: yup.string().nullable().max(64, 'Слишком длинное название страны'),
        installedPeriod: yup.string().nullable().max(20, 'Слишком длинный период создания'),
        removalPeriod: yup.string().nullable().max(20, 'Слишком длинный период пропажи'),
        source: yup.string().nullable().url('Должна быть валидной ссылкой'),
    });

    const {form, data, errors, isSubmitting, reset, setData, isDirty, setIsDirty} = createForm<
        yup.InferType<typeof schema>
    >({
        onSubmit: async (values: LooseObject) => {
            handleSave(values);
        },
        extend: validator({schema}),
    });

    $: if ($isDirty.valueOf()) {
        activeObjectInfo.update(value => ({...value, isDirty: true}));
    }

    function handleRatingChange(event) {
        if (event.detail === null) {
            setData('rating', '');
        }
        setData('rating', event.detail.value);
        setIsDirty(true);
    }

    function handleCategoryChange(event) {
        setData('category', event.detail.id);
        setIsDirty(true);
    }

    async function handleSave(values: LooseObject) {
        values.category = {id: values.category};
        values.tags = tags.map(item => ({id: item}));
        values.privateTags = privateTags.map(item => ({id: item}));

        if (!$activeObjectInfo.object) {
            return;
        }

        if (!values.id) {
            await toast.promise(createNewObject(values), {
                loading: 'Создаю...',
                success: 'Точка создана!',
                error: 'Не удалось создать точку',
            });
        } else {
            await toast.promise(updateExistingObject(values), {
                loading: 'Обновляю...',
                success: 'Точка обновлена!',
                error: 'Не удалось обновить точку',
            });
        }
    }

    async function createNewObject(object: Object) {
        try {
            const result = await $createObjectMutation.mutateAsync(object);
            client.setQueryData(['object', {id: result.data.id}], {
                message: '',
                data: {object: result.data},
            });
            markerList.addMarker(result.data);
            activeObjectInfo.reset();
        } catch (error) {
            if (error instanceof RequestError && error.payload.errors) {
                errors.set(error.payload.errors);
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
        } catch (error) {
            if (error instanceof RequestError && error.payload.errors) {
                errors.set(error.payload.errors);
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
        <FormInput
            id="name"
            name="name"
            value={initialValues.name ?? ''}
            label="Название"
            error={$errors.name}
        />
    </div>
    <Checkbox id="isVisited" name="isVisited" checked={initialValues.isVisited} label="Посещена" />
    <FormSelect
        id="rating"
        name="rating"
        label="Рейтинг"
        placeholder="Выберите"
        value={initialValues.rating}
        options={[
            {value: '1', text: '⭐️'},
            {value: '2', text: '⭐⭐'},
            {value: '3', text: '🌟🌟🌟'},
        ]}
        on:change={handleRatingChange}
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
            on:change={handleCategoryChange}
            error={$errors.category}
        />
    </div>
    <div class="fieldLong">
        <TagsSelect id="tags" name="tags" bind:value={tags} error={$errors.tags} />
    </div>
    <div class="fieldLong">
        <PrivateTagsSelect
            id="privateTags"
            name="privateTags"
            bind:value={privateTags}
            error={$errors.privateTags}
        />
    </div>
    <div class="fieldLong">
        <FormTextarea
            id="description"
            name="description"
            value={initialValues.description ?? ''}
            label="Информация"
            error={$errors.description}
        />
    </div>
    <div class="fieldLong">
        <FormInput
            id="address"
            name="address"
            value={initialValues.address ?? ''}
            label="Адрес"
            error={$errors.address}
        />
    </div>
    <div class="fieldLong">
        <FormInput
            id="city"
            name="city"
            value={initialValues.city ?? ''}
            label="Город"
            error={$errors.city}
        />
    </div>
    <div class="fieldLong">
        <FormInput
            id="country"
            name="country"
            value={initialValues.country ?? ''}
            label="Страна"
            error={$errors.country}
        />
    </div>
    <div class="fieldLong">
        <FormInput
            id="installedPeriod"
            name="installedPeriod"
            value={initialValues.installedPeriod ?? ''}
            label="Период создания"
            error={$errors.installedPeriod}
        />
    </div>
    <div class="removedCheckbox">
        <Checkbox
            id="isRemoved"
            name="isRemoved"
            checked={initialValues.isRemoved}
            label="Утрачена"
        />
    </div>
    {#if data.isRemoved}
        <div class="field">
            <FormInput
                id="removalPeriod"
                name="removalPeriod"
                value={initialValues.removalPeriod ?? ''}
                label="Период пропажи"
                error={$errors.removalPeriod}
            />
        </div>
    {/if}
    <div class="fieldLong">
        <FormInput
            id="source"
            name="source"
            value={initialValues.source ?? ''}
            label="Ссылка на источник"
            error={$errors.source}
        />
    </div>
    <div class="actions">
        <div class="save-button">
            <PrimaryButton type="submit" disabled={$isSubmitting.valueOf()}>
                Сохранить
            </PrimaryButton>
        </div>
        {#if initialValues.id}
            <BackButton isConfirmationRequired={$isDirty.valueOf()} on:click={handleBack} />
            <span class="flexer" />
            <DeleteButton on:click={handleDelete} />
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

    .label {
        @include typography.size-14;
        margin-bottom: 4px;
    }

    .removedCheckbox {
        height: 62.1px;
        display: flex;
    }
</style>
