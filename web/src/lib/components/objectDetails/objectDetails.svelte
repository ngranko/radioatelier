<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    import {fly} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import type {LooseObject} from '$lib/interfaces/object';
    import Form from '$lib/components/objectDetails/form.svelte';
    import ViewMode from '$lib/components/objectDetails/viewMode.svelte';
    import ImageUpload from '$lib/components/input/imageUpload.svelte';
    import {createMutation} from '@tanstack/svelte-query';
    import {uploadImage} from '$lib/api/object';
    import toast from 'svelte-french-toast';
    import CloseButton from '$lib/components/objectDetails/closeButton.svelte';

    const dispatch = createEventDispatcher();

    export let key: string;
    export let initialValues: Partial<LooseObject>;
    export let isLoading: boolean = false;
    export let isEditing: boolean = false;

    const image = createMutation({
        mutationFn: uploadImage,
    });

    function handleImageChange(event: CustomEvent<File>) {
        const file = event.detail;

        const formData = new FormData();
        formData.append('file', file);

        toast.promise(
            $image.mutateAsync({id: initialValues.id as string, formData}).then(result => {
                console.log(result);
                initialValues.image = result.data.url;
            }),
            {
                loading: 'Загружаю...',
                success: 'Фото загружено!',
                error: 'Не удалось загрузить фото',
            },
        );
    }

    function handleClose() {
        dispatch('close');
    }
</script>

<aside class="popup" transition:fly={{x: -100, duration: 200, easing: cubicInOut}}>
    <section class="header">
        <CloseButton on:click={handleClose} />
    </section>
    {#key key}
        {#if isLoading}
            <!-- TODO: do a proper loader later -->
            <div class="loader">Loading...</div>
        {:else}
            <div class="scroller">
                <div class="image-uploader">
                    <ImageUpload
                        bind:value={initialValues.image}
                        on:change={handleImageChange}
                        disabled={!isEditing}
                    />
                </div>
                {#if isEditing}
                    <Form {initialValues} on:save on:delete />
                {:else}
                    <ViewMode {initialValues} on:delete />
                {/if}
            </div>
        {/if}
    {/key}
</aside>

<style lang="scss">
    @use '../../../styles/colors';

    .popup {
        position: absolute;
        display: flex;
        flex-direction: column;
        width: calc(100dvw - 8px * 2);
        max-width: 400px;
        height: calc(100dvh - 8px * 2);
        margin: 8px;
        border-radius: 10px;
        z-index: 1;
        background-color: white;
    }

    .header {
        display: flex;
        justify-content: flex-end;
        padding: 12px;
    }

    .loader {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .scroller {
        overflow-y: auto;
        --webkit-overflow-scrolling: touch;
    }

    .image-uploader {
        margin-bottom: 16px;
    }
</style>
