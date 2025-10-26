<script lang="ts">
    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import {Button} from '$lib/components/ui/button';

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
        value = $bindable(),
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

<div class="relative w-full overflow-hidden rounded-lg border-2 border-gray-300 bg-gray-50">
    <button
        type="button"
        class="block aspect-2/1 w-full border-none bg-cover bg-center bg-no-repeat"
        style="background-image:url('{value && value.length ? value : '/image_empty.jpg'}')"
        onclick={handleOpen}
        aria-label="Изображение"
    ></button>
    {#if !disabled}
        <div class="absolute right-3 bottom-3 flex gap-3">
            <Button
                variant="secondary"
                size="icon"
                class="text-base text-black hover:bg-gray-200"
                onclick={handleUploadClick}
                aria-label="Загрузить изображение"
            >
                <i class="fa-solid fa-arrow-up-from-bracket"></i>
            </Button>
            {#if value}
                <Button
                    variant="secondary"
                    size="icon"
                    class="text-destructive text-base"
                    onclick={handleRemoveClick}
                    aria-label="Удалить изображение"
                >
                    <i class="fa-solid fa-trash"></i>
                </Button>
            {/if}
        </div>
    {/if}
    <input type="hidden" {name} {value} />
    <input
        bind:this={imageUploadRef}
        class="hidden"
        {id}
        type="file"
        accept="image/jpeg,image/png"
        onchange={handleImageChange}
        {disabled}
    />

    {#if isPreviewOpen}
        <button
            class="fixed inset-0 z-10 flex items-center justify-center border-none bg-black/50"
            onclick={handleClose}
            transition:fade={{duration: 100, easing: cubicInOut}}
            type="button"
        >
            <img class="max-h-full max-w-full" src={value} alt="Изображение" />
        </button>
    {/if}
</div>
