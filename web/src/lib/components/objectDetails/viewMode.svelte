<script lang="ts">
    import type {LooseObject} from '$lib/interfaces/object';
    import {activeObjectInfo, map} from '$lib/stores/map';
    import Flags from '$lib/components/objectDetails/flags.svelte';
    import IconButton from '$lib/components/button/iconButton.svelte';
    import {createEventDispatcher} from 'svelte';
    import toast from 'svelte-french-toast';

    const dispatch = createEventDispatcher();

    export let initialValues: Partial<LooseObject>;

    function handleEditClick() {
        activeObjectInfo.update(value => ({
            ...value,
            isEditing: true,
            isDirty: false,
        }));
    }

    function handleRouteClick() {
        window.location = `https://www.google.com/maps/dir/?api=1&destination=${initialValues.lat},${initialValues.lng}&dir_action=navigate`;
    }

    function handleStreetViewClick() {
        const streetView = new google.maps.StreetViewService();
        streetView
            .getPanorama({
                location: new google.maps.LatLng(initialValues.lat, initialValues.lng),
                radius: 50,
            })
            .then(({data}: google.maps.StreetViewResponse) => {
                const location = data.location!;
                const pano = $map.getStreetView();
                pano.setPano(location.pano as string);
                pano.setVisible(true);
                activeObjectInfo.update(value => ({...value, isMinimized: true}));
            })
            .catch(error => {
                console.error(error);
                toast.error('Нет панорамы для этой точки');
            });
    }

    function startsWithNumber(str: string): boolean {
        const char = str.charAt(0);
        return char >= '0' && char <= '9';
    }

    function composeAddress(): string {
        const addressArray: string[] = [];
        if (initialValues.address) {
            addressArray.push(initialValues.address);
        }
        if (initialValues.city) {
            addressArray.push(initialValues.city);
        }
        if (initialValues.country) {
            addressArray.push(initialValues.country);
        }
        return addressArray.join(', ');
    }
</script>

<div class="preview">
    <Flags
        isPublic={initialValues.isPublic}
        isVisited={initialValues.isVisited}
        isRemoved={initialValues.isRemoved}
    />
    {#if initialValues.rating}
        <div class="rating">
            {#if initialValues.rating === '1'}
                ⭐️
            {/if}
            {#if initialValues.rating === '2'}
                ⭐️⭐️
            {/if}
            {#if initialValues.rating === '3'}
                🌟🌟🌟️
            {/if}
        </div>
    {/if}
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
    <div class="actions">
        <IconButton icon="fa-solid fa-pen" on:click={handleEditClick} />
        <IconButton icon="fa-solid fa-route" on:click={handleRouteClick} />
        <IconButton icon="fa-solid fa-street-view" on:click={handleStreetViewClick} />
    </div>
    {#if initialValues.address || initialValues.city || initialValues.country}
        <p>
            {composeAddress()}
        </p>
    {/if}
    {#if initialValues.description}
        <p>{initialValues.description}</p>
    {/if}
    {#if initialValues.installedPeriod}
        <p>
            Появилась <span class="lowercase">
                {startsWithNumber(initialValues.installedPeriod)
                    ? 'в ' + initialValues.installedPeriod
                    : initialValues.installedPeriod}
            </span>
        </p>
    {/if}
    {#if initialValues.removalPeriod}
        <p>
            Пропала <span class="lowercase">
                {startsWithNumber(initialValues.removalPeriod)
                    ? 'в ' + initialValues.removalPeriod
                    : initialValues.removalPeriod}
            </span>
        </p>
    {/if}
    {#if initialValues.source}
        <p>
            <a href={initialValues.source} target="_blank" rel="noopener noreferrer nofollow">
                Источник
            </a>
        </p>
    {/if}
</div>

<style lang="scss">
    @use 'sass:color';
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .preview {
        position: relative;
        padding: 16px 24px 24px;
    }

    .rating {
        @include typography.size-22;
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
        margin-top: 4px;
    }

    .tag-private {
        padding: 0 4px 2px;
        background-color: color.scale(colors.$secondary, $lightness: +80%);
        border-radius: 4px;
        margin-right: 4px;
        margin-top: 4px;
    }

    .actions {
        margin: 8px 0;
        display: flex;
        gap: 16px;
    }

    .lowercase {
        text-transform: lowercase;
    }
</style>
