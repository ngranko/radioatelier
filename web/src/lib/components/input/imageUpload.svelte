<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';

    const dispatch = createEventDispatcher();

    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let value: string | undefined = undefined;
    export let disabled: boolean = false;

    let isOpen = false;

    let imageUploadRef: HTMLInputElement;

    function handleImageChange(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
            console.error('no file selected');
            return;
        }

        dispatch('change', file);
    }

    function handleButtonClick() {
        imageUploadRef.click();
    }

    function handleOpen() {
        if (!value) {
            return;
        }

        isOpen = true;
    }

    function handleClose() {
        isOpen = false;
    }
</script>

<div class="root">
    <button
        type="button"
        class="display"
        style="background-image:url('{value && value.length ? value : '/image_empty.jpg'}')"
        on:click={handleOpen}
    />
    {#if !disabled}
        <button type="button" class="button" on:click={handleButtonClick}>
            {value ? 'Сменить изображение' : 'Загрузить изображение'}
        </button>
    {/if}
    <input type="hidden" {name} {value} />
    <input
        bind:this={imageUploadRef}
        class="imageUpload"
        {id}
        type="file"
        accept="image/jpeg,image/png"
        on:change={handleImageChange}
        {disabled}
    />

    {#if isOpen}
        <button
            class="overlay"
            on:click={handleClose}
            transition:fade={{duration: 200, easing: cubicInOut}}
            type="button"
        >
            <img class="preview" src={value} alt="Изображение" />
        </button>
    {/if}
</div>

<style lang="scss">
    @use '../../../styles/typography';

    .root {
        position: relative;
    }

    .display {
        display: block;
        width: 100%;
        aspect-ratio: 2 / 1;
        border: none;
        background-size: cover;
        background-repeat: no-repeat;
        cursor: pointer;
    }

    .button {
        @include typography.brand-face;
        position: absolute;
        left: 0;
        bottom: 0;
    }

    .imageUpload {
        display: none;
    }

    .overlay {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        border: none;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10;
    }

    .preview {
        max-width: 100%;
    }
</style>
