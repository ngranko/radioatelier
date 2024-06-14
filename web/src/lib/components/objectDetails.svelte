<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    import {fly} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import CategorySelect from '$lib/components/categorySelect.svelte';
    import type {Object} from '$lib/interfaces/object';

    const dispatch = createEventDispatcher();

    export let initialValues: Partial<Object>;

    function handleSave(event: SubmitEvent) {
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        const values = Object.fromEntries(formData) as unknown as Object;

        dispatch('save', values);
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
    {#key `${initialValues.lat},${initialValues.lng}`}
        <form method="POST" on:submit|preventDefault|stopPropagation={handleSave}>
            <input type="hidden" name="id" value={initialValues.id} />
            <div>Lattitude: {initialValues.lat}</div>
            <input type="hidden" name="lat" value={initialValues.lat} />
            <div>Longitude: {initialValues.lng}</div>
            <input type="hidden" name="lng" value={initialValues.lng} />
            <label>
                Name: <input name="name" value={initialValues.name ?? ''} />
            </label>
            <CategorySelect name="categoryId" value={initialValues.categoryId} />
            <button type="submit">Save</button>
            {#if initialValues.id}
                <button type="button" on:click={handleDelete}>Delete</button>
            {/if}
        </form>
    {/key}
</aside>

<style lang="scss">
    @use '../../styles/colors';

    .popup {
        position: absolute;
        width: 300px;
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
            color: colors.$neonBlue;
        }
    }
</style>
