<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    import type {LooseObject} from '$lib/interfaces/object';
    import PrimaryButton from '$lib/components/button/primaryButton.svelte';
    import DeleteButton from '$lib/components/objectDetails/editMode/deleteButton.svelte';
    import BackButton from '$lib/components/objectDetails/editMode/backButton.svelte';
    import {activeObjectInfo} from '$lib/stores/map';
    import {createForm} from 'felte';
    import * as yup from 'yup';
    import {validator} from '@felte/validator-yup';
    import CategorySelect from '$lib/components/objectDetails/editMode/categorySelect.svelte';
    import PrivateTagsSelect from '$lib/components/objectDetails/editMode/privateTagsSelect.svelte';
    import Textarea from '$lib/components/input/textarea.svelte';
    import Checkbox from '$lib/components/input/checkbox.svelte';
    import FormSelect from '$lib/components/form/formSelect.svelte';
    import TagsSelect from '$lib/components/objectDetails/editMode/tagsSelect.svelte';
    import Switch from '$lib/components/input/switch.svelte';
    import Input from '$lib/components/input/input.svelte';

    const dispatch = createEventDispatcher();

    export let initialValues: Partial<LooseObject>;

    let tags = initialValues.tags?.map(item => item.id) ?? [];
    let privateTags = initialValues.privateTags?.map(item => item.id) ?? [];

    const schema = yup.object({});

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

    function handleSave(values: LooseObject) {
        values.category = {id: values.category};
        values.tags = tags.map(item => ({id: item}));
        values.privateTags = privateTags.map(item => ({id: item}));

        dispatch('save', values);
    }

    function handleDelete() {
        dispatch('delete', initialValues.id);
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
        <label for="name" class="label">Название</label>
        <Input id="name" name="name" value={initialValues.name ?? ''} />
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
    />
    <div class="fieldLong">
        <Switch id="isPublic" name="isPublic" checked={initialValues.isPublic} label="Публичная" />
    </div>
    <div class="fieldLong">
        <label for="category" class="label">Категория</label>
        <CategorySelect
            id="category"
            name="category"
            value={initialValues.category?.id ?? ''}
            on:change={handleCategoryChange}
        />
    </div>
    <div class="fieldLong">
        <label for="tags" class="label">Теги</label>
        <TagsSelect id="tags" name="tags" bind:value={tags} />
    </div>
    <div class="fieldLong">
        <label for="privateTags" class="label">Приватные теги</label>
        <PrivateTagsSelect id="privateTags" name="privateTags" bind:value={privateTags} />
    </div>
    <div class="fieldLong">
        <label for="description" class="label">Информация</label>
        <Textarea id="description" name="description" value={initialValues.description ?? ''} />
    </div>
    <div class="fieldLong">
        <label for="address" class="label">Адрес</label>
        <Input id="address" name="address" value={initialValues.address ?? ''} />
    </div>
    <div class="fieldLong">
        <label for="city" class="label">Город</label>
        <Input id="city" name="city" value={initialValues.city ?? ''} />
    </div>
    <div class="fieldLong">
        <label for="country" class="label">Страна</label>
        <Input id="country" name="country" value={initialValues.country ?? ''} />
    </div>
    <div class="fieldLong">
        <label for="installedPeriod" class="label">Период создания</label>
        <Input
            id="installedPeriod"
            name="installedPeriod"
            value={initialValues.installedPeriod ?? ''}
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
            <label for="removalPeriod" class="label">Период пропажи</label>
            <Input
                id="removalPeriod"
                name="removalPeriod"
                value={initialValues.removalPeriod ?? ''}
            />
        </div>
    {/if}
    <div class="fieldLong">
        <label for="source" class="label">Ссылка на источник</label>
        <Input id="source" name="source" value={initialValues.source ?? ''} />
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
