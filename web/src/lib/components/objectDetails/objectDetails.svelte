<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    import {fly} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import type {LooseObject} from '$lib/interfaces/object';
    import Form from '$lib/components/objectDetails/editMode/form.svelte';
    import ViewMode from '$lib/components/objectDetails/viewMode.svelte';
    import ImageUpload from '$lib/components/input/imageUpload.svelte';
    import {createMutation} from '@tanstack/svelte-query';
    import {uploadImage} from '$lib/api/object';
    import toast from 'svelte-french-toast';
    import {activeMarker, activeObjectInfo, map} from '$lib/stores/map';
    import CloseConfirmation from '$lib/components/objectDetails/closeConfirmation.svelte';
    import IconButton from '$lib/components/button/iconButton.svelte';
    import {clsx} from 'clsx';

    const dispatch = createEventDispatcher();

    export let key: string;
    export let initialValues: Partial<LooseObject>;
    export let isLoading: boolean = false;
    export let isEditing: boolean = false;

    let isCloseConfirmationOpen = false;

    const image = createMutation({
        mutationFn: uploadImage,
    });

    function handleImageChange(event: CustomEvent<File>) {
        const file = event.detail;

        const formData = new FormData();
        formData.append('file', file);

        toast.promise(
            $image.mutateAsync({id: initialValues.id as string, formData}).then(result => {
                initialValues.image = result.data.url;
            }),
            {
                loading: 'Загружаю...',
                success: 'Фото загружено!',
                error: 'Не удалось загрузить фото',
            },
        );
    }

    function handleMinimizeClick() {
        activeObjectInfo.update(value => ({...value, isMinimized: !value.isMinimized}));
    }

    function handleCloseClick() {
        if ($activeObjectInfo.isDirty) {
            isCloseConfirmationOpen = true;
        } else {
            handleClose();
        }
    }

    function handleClose() {
        if (!$activeObjectInfo.object) {
            return;
        }

        activeMarker.deactivate();
        activeObjectInfo.reset();
        $map.getStreetView().setVisible(false);
    }
</script>

<div class="background" on:click={handleCloseClick} />
<aside
    class={clsx(['popup', {minimized: $activeObjectInfo.isMinimized}])}
    transition:fly={{x: -100, duration: 200, easing: cubicInOut}}
>
    <section class="header">
        <span class="headerTitle">{initialValues.name ?? ''}</span>
        <IconButton
            icon={`fa-solid ${$activeObjectInfo.isMinimized ? 'fa-chevron-up' : 'fa-chevron-down'}`}
            on:click={handleMinimizeClick}
        />
        <IconButton icon="fa-solid fa-xmark" on:click={handleCloseClick} />
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
<CloseConfirmation bind:isOpen={isCloseConfirmationOpen} on:click={handleClose} />

<style lang="scss">
    @use '../../../styles/colors';

    .background {
        position: fixed;
        inset: 0;
        background-color: transparent;
        z-index: 1;
    }

    .popup {
        position: absolute;
        bottom: 0;
        width: calc(100dvw - 8px * 2);
        max-width: 400px;
        height: calc(100dvh - 8px * 2);
        margin: 8px;
        display: flex;
        flex-direction: column;
        border-radius: 10px;
        background-color: white;
        transition: height 0.2s;
        z-index: 2;
    }

    .minimized {
        height: 64px;
    }

    .header {
        display: flex;
        align-items: center;
        padding: 12px;
        gap: 8px;
    }

    .headerTitle {
        margin-right: 8px;
        color: transparent;
        overflow: hidden;
        text-overflow: ellipsis;
        text-wrap: nowrap;
        flex: 1;
        transition: color 0.2s;

        .minimized & {
            color: colors.$black;
        }
    }

    .loader {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .scroller {
        overflow-x: hidden;
        overflow-y: auto;
        --webkit-overflow-scrolling: touch;
    }

    .image-uploader {
        margin-bottom: 16px;
    }
</style>
