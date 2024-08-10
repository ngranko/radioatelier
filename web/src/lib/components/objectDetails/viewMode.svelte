<script lang="ts">
    import type {LooseObject} from '$lib/interfaces/object';
    import TextButton from '$lib/components/button/textButton.svelte';
    import {activeObjectInfo} from '$lib/stores/map';
    import DeleteButton from '$lib/components/objectDetails/deleteButton.svelte';
    import {createEventDispatcher} from 'svelte';

    const dispatch = createEventDispatcher();

    export let initialValues: Partial<LooseObject>;

    function handleEditClick() {
        activeObjectInfo.update(value => ({
            ...value,
            isEditing: true,
        }));
    }

    function handleDelete() {
        dispatch('delete', initialValues.id);
    }
</script>

<div class="preview">
    <div class="category">{initialValues.category?.name ?? ''}</div>
    <h1 class="name">{initialValues.name}</h1>
    <div class="tags">
        {#each initialValues.tags?.sort((a, b) => a.name.localeCompare(b.name)) ?? [] as tag}
            <span class="tag">{tag.name}</span>
        {/each}
        {#each initialValues.privateTags?.sort((a, b) => a.name.localeCompare(b.name)) ?? [] as tag}
            <span class="tag-private">{tag.name}</span>
        {/each}
    </div>
    <div class="flags">
        {#if initialValues.isPublic}
            <div title="Публичная" class="flag">
                <i class="fa-regular fa-eye"></i>
            </div>
        {:else}
            <div title="Приватная" class="flag">
                <i class="fa-regular fa-eye-slash"></i>
            </div>
        {/if}
        {#if initialValues.isRemoved}
            <div title="Уничтожена" class="flag">
                <i class="fa-solid fa-ghost"></i>
            </div>
        {/if}
    </div>
    {#if initialValues.address}
        <p>{initialValues.address}</p>
    {/if}
    {#if initialValues.description}
        <p>{initialValues.description}</p>
    {/if}
    {#if initialValues.installedPeriod}
        <p>Появилась в {initialValues.installedPeriod}</p>
    {/if}
    {#if initialValues.removalPeriod}
        <p>Пропала в {initialValues.removalPeriod}</p>
    {/if}
    {#if initialValues.source}
        <p>
            <a href={initialValues.source} target="_blank" rel="noopener noreferrer nofollow">
                Источник
            </a>
        </p>
    {/if}
    <div class="actions">
        <TextButton on:click={handleEditClick}>Редактировать</TextButton>
        <DeleteButton on:click={handleDelete} />
    </div>
</div>

<style lang="scss">
    @use 'sass:color';
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .preview {
        padding: 16px 24px 24px;
    }

    .category {
        @include typography.weight-bold;
    }

    .name {
        @include typography.size-28;
        margin-top: 0;
        margin-bottom: 8px;
    }

    .tags {
        display: flex;
        flex-wrap: wrap;
    }

    .tag {
        padding: 0 4px 2px;
        background-color: color.scale(colors.$primary, $lightness: +80%);
        border-radius: 4px;
        margin-right: 4px;
    }

    .tag-private {
        padding: 0 4px 2px;
        background-color: color.scale(colors.$secondary, $lightness: +80%);
        border-radius: 4px;
        margin-right: 4px;
    }

    .flags {
        @include typography.size-22;
        margin-top: 8px;
        display: flex;
    }

    .flag {
        width: 40px;
        height: 40px;
        margin-right: 16px;
        border-radius: 50%;
        background-color: colors.$lightgray;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .actions {
        display: flex;
        justify-content: space-between;
    }
</style>
