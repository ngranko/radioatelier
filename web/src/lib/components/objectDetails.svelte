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

<style>
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
</style>