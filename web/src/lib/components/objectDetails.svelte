<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    import {fly} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import CategorySelect from '$lib/components/categorySelect.svelte';
    import type {LooseObject} from '$lib/interfaces/object';
    import Input from '$lib/components/input/input.svelte';
    import Textarea from '$lib/components/input/textarea.svelte';

    const dispatch = createEventDispatcher();

    export let initialValues: Partial<LooseObject>;

    function handleSave(event: SubmitEvent) {
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        const values = Object.fromEntries(formData) as unknown as LooseObject;

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
        <form class="form" method="POST" on:submit|preventDefault|stopPropagation={handleSave}>
            <input type="hidden" name="id" value={initialValues.id} />
            <input type="hidden" name="lat" value={initialValues.lat} />
            <input type="hidden" name="lng" value={initialValues.lng} />

            <div class="field">
                <label for="name" class="label">Название</label>
                <Input id="name" name="name" value={initialValues.name ?? ''} />
            </div>
            <div class="field">
                <label for="categoryId" class="label">Категория</label>
                <CategorySelect
                    id="categoryId"
                    name="categoryId"
                    value={initialValues.categoryId}
                />
            </div>
            <div class="field">
                <label for="description" class="label">Информация</label>
                <Textarea
                    id="description"
                    name="description"
                    value={initialValues.description ?? ''}
                />
            </div>
            <div class="field">
                <label for="address" class="label">Адрес</label>
                <Input id="address" name="address" value={initialValues.address ?? ''} />
            </div>
            <div class="field">
                <label for="installedPeriod" class="label">Период создания</label>
                <Input
                    id="installedPeriod"
                    name="installedPeriod"
                    value={initialValues.installedPeriod ?? ''}
                />
            </div>
            {#if initialValues.isRemoved}
                <div class="field">
                    <label for="removalPeriod" class="label">Период пропажи</label>
                    <Input
                        id="removalPeriod"
                        name="removalPeriod"
                        value={initialValues.removalPeriod ?? ''}
                    />
                </div>
            {/if}
            <div>
                <button type="submit">Save</button>
                {#if initialValues.id}
                    <button type="button" on:click={handleDelete}>Delete</button>
                {/if}
            </div>
        </form>
    {/key}
</aside>

<style lang="scss">
    @use '../../styles/colors';
    @use '../../styles/typography';

    .popup {
        position: absolute;
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
            color: colors.$neonBlue;
        }
    }

    .form {
        display: grid;
        grid-template-columns: 1fr;
        grid-gap: 16px;
    }

    .field {
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    .label {
        @include typography.size-14;
        margin-bottom: 4px;
    }
</style>
