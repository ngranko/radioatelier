<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    import {fly} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import type {LooseObject} from '$lib/interfaces/object';
    import FormContents from '$lib/components/objectDetails/formContents.svelte';
    import PrimaryButton from '$lib/components/button/primaryButton.svelte';
    import TextButton from '$lib/components/button/textButton.svelte';

    const dispatch = createEventDispatcher();

    export let key: string;
    export let initialValues: Partial<LooseObject>;
    export let isLoading: boolean = false;

    let tags: string[] = [];
    let privateTags: string[] = [];

    function handleSave(event: SubmitEvent) {
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        const formValues = Object.fromEntries(formData) as unknown as LooseObject;
        formValues.isRemoved = Boolean(formValues.isRemoved);
        formValues.tags = tags;
        formValues.privateTags = privateTags;

        dispatch('save', formValues);
    }

    function handleClose() {
        dispatch('close');
    }

    function handleDelete() {
        dispatch('delete', initialValues.id);
    }
</script>

<aside class="popup" transition:fly={{x: -100, duration: 200, easing: cubicInOut}}>
    <section class="header">
        <button class="close" on:click={handleClose}>
            <i class="fa-solid fa-xmark"></i>
        </button>
    </section>
    {#key key}
        {#if isLoading}
            <!-- TODO: do a proper loader later -->
            <div class="loader">Loading...</div>
        {:else}
            <form class="form" method="POST" on:submit|preventDefault|stopPropagation={handleSave}>
                <FormContents {initialValues} bind:tags bind:privateTags />
                <div class="actions">
                    <PrimaryButton type="submit">Сохранить</PrimaryButton>
                    {#if initialValues.id}
                        <TextButton type="submit" modifier="danger" on:click={handleDelete}>
                            Удалить
                        </TextButton>
                    {/if}
                </div>
            </form>
        {/if}
    {/key}
</aside>

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .popup {
        position: absolute;
        display: flex;
        flex-direction: column;
        width: 400px;
        height: calc(100vh - 8px * 2);
        margin: 8px;
        padding: 24px;
        border-radius: 10px;
        z-index: 1;
        background-color: white;
    }

    .header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 16px;
    }

    .close {
        border: 0;
        padding: 0;
        margin: 0;
        background: none;
        font-size: 26px;
        cursor: pointer;
        transition: 0.2s;

        &:hover {
            color: colors.$primary;
        }
    }

    .loader {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .form {
        display: grid;
        grid-template-columns: 1fr;
        grid-gap: 16px;
        align-content: flex-start;
        flex: 1;
        overflow-y: auto;
        --webkit-overflow-scrolling: touch;
    }

    .actions {
        position: sticky;
        bottom: 0;
        padding-top: 8px;
        border-top: 1px solid colors.$lightgray;
        background-color: white;
    }
</style>
