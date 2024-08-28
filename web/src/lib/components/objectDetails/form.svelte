<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    import type {LooseObject} from '$lib/interfaces/object';
    import FormContents from '$lib/components/objectDetails/formContents.svelte';
    import PrimaryButton from '$lib/components/button/primaryButton.svelte';
    import TextButton from '$lib/components/button/textButton.svelte';
    import DeleteButton from '$lib/components/objectDetails/deleteButton.svelte';
    import {activeObjectInfo} from '$lib/stores/map';

    const dispatch = createEventDispatcher();

    export let initialValues: Partial<LooseObject>;

    function handleSave(event: SubmitEvent) {
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        const formValues = Object.fromEntries(formData) as unknown as LooseObject;
        formValues.isRemoved = Boolean(formValues.isRemoved);
        formValues.isPublic = Boolean(formValues.isPublic);
        formValues.isVisited = Boolean(formValues.isVisited);
        formValues.category = initialValues.category ?? {id: '', name: ''};
        formValues.tags = initialValues.tags ?? [];
        formValues.privateTags = initialValues.privateTags ?? [];

        dispatch('save', formValues);
    }

    function handleDelete() {
        dispatch('delete', initialValues.id);
    }

    function handleBack() {
        activeObjectInfo.update(value => ({
            ...value,
            isEditing: false,
        }));
    }
</script>

<form class="form" method="POST" on:submit|preventDefault|stopPropagation={handleSave}>
    <FormContents {initialValues} />
    <div class="actions">
        <div class="save-button">
            <PrimaryButton type="submit">Сохранить</PrimaryButton>
        </div>
        {#if initialValues.id}
            <TextButton type="button" on:click={handleBack}>Назад</TextButton>
            <span class="flexer" />
            <DeleteButton on:click={handleDelete} />
        {/if}
    </div>
</form>

<style lang="scss">
    @use '../../../styles/colors';

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
</style>
