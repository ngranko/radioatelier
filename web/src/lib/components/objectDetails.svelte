<script lang="ts">
    import {createEventDispatcher, onMount} from 'svelte';
    import {fly} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import CategorySelect from '$lib/components/categorySelect.svelte';
    import type {CreateObjectInputs} from '$lib/interfaces/object';

    const dispatch = createEventDispatcher();

    export let initialValues: Partial<CreateObjectInputs>;

    function handleSave(event: SubmitEvent) {
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        const values = Object.fromEntries(formData) as unknown as CreateObjectInputs;

        dispatch('save', values);
    }

    function handleClose() {
        dispatch('close');
    }
</script>

<aside class="popup" transition:fly={{x: -100, duration: 200, easing: cubicInOut}}>
    {#key `${initialValues.lat},${initialValues.lng}`}
        <form method="POST" on:submit|preventDefault|stopPropagation={handleSave}>
            <h1>Marker info</h1>
            <div>Lattitude: {initialValues.lat}</div>
            <input type="hidden" name="lat" value={initialValues.lat} />
            <div>Longitude: {initialValues.lng}</div>
            <input type="hidden" name="lng" value={initialValues.lng} />
            <label>
                Name: <input name="name" value={initialValues.name ?? ''} />
            </label>
            <CategorySelect name="categoryId" />
            <button type="submit">Add</button>
            <button type="button" on:click={handleClose}>Close</button>
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
