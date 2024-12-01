<script lang="ts">
    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';

    interface Props {
        id?: string | undefined;
        name?: string | undefined;
        value?: string | undefined;
        disabled?: boolean;
        onChange(file: File): void;
    }

    let {
        id = undefined,
        name = undefined,
        value = $bindable(undefined),
        disabled = false,
        onChange,
    }: Props = $props();

    let isPreviewOpen = $state(false);

    let imageUploadRef: HTMLInputElement | undefined = $state();

    function handleImageChange(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
            console.error('no file selected');
            return;
        }

        onChange(file);
    }

    function handleUploadClick() {
        imageUploadRef?.click();
    }

    function handleRemoveClick() {
        value = undefined;
    }

    function handleOpen() {
        if (!value) {
            return;
        }

        isPreviewOpen = true;
    }

    function handleClose() {
        isPreviewOpen = false;
    }
</script>

<div class="root">
    <button
        type="button"
        class="display"
        style="background-image:url('{value && value.length ? value : '/image_empty.jpg'}')"
        onclick={handleOpen}
        aria-label="Изображение"
    ></button>
    {#if !disabled}
        <div class="actions">
            <button type="button" class="button" onclick={handleUploadClick}>
                {value ? 'Сменить изображение' : 'Загрузить изображение'}
            </button>
            {#if value}
                <button type="button" class="button-delete" onclick={handleRemoveClick}>
                    Удалить изображение
                </button>
            {/if}
        </div>
    {/if}
    <input type="hidden" {name} {value} />
    <input
        bind:this={imageUploadRef}
        class="imageUpload"
        {id}
        type="file"
        accept="image/jpeg,image/png"
        onchange={handleImageChange}
        {disabled}
    />

    {#if isPreviewOpen}
        <button
            class="overlay"
            onclick={handleClose}
            transition:fade={{duration: 200, easing: cubicInOut}}
            type="button"
        >
            <img class="preview" src={value} alt="Изображение" />
        </button>
    {/if}
</div>

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .root {
        position: relative;
    }

    .display {
        display: block;
        width: 100%;
        aspect-ratio: 2 / 1;
        border: none;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        cursor: pointer;
    }

    .actions {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: space-between;
    }

    .button {
        @include typography.brand-face;
    }

    .button-delete {
        @include typography.brand-face;
        color: colors.$danger;
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
        max-height: 100%;
    }
</style>
