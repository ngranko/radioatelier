<script lang="ts">
    import CategoryBadge from '$lib/components/categoryBadge.svelte';
    import {Button} from '$lib/components/ui/button';
    import type {SearchItem} from '$lib/interfaces/object';
    import {cn} from '$lib/utils';
    import {searchState} from '$lib/state/search.svelte';
    import {formatDistance, metresBetween} from '$lib/utils/distance';
    import {SvglGoogleLogo} from '@selemondev/svgl-svelte';
    import {focusAdjacentResult, readArrowStep} from './resultFocus';

    let {object, onClick}: {object: SearchItem; onClick: () => void} = $props();

    function composeAddress(object: SearchItem) {
        let result = object.address ?? '';

        if (object.address && (object.city || object.country)) {
            result += ', ';
        }

        result += object.city ?? '';

        if (object.city && object.country) {
            result += ', ';
        }

        result += object.country ?? '';

        return result;
    }

    function handleKeydown(evt: KeyboardEvent) {
        const step = readArrowStep(evt.key);
        if (step && focusAdjacentResult(evt.currentTarget as HTMLElement, step)) {
            evt.preventDefault();
        }
    }

    // Every result is measured from the point the search ran at, not from the map
    // as it stands now, so the whole list keeps agreeing with itself while panning.
    const distance = $derived.by(() => {
        const lat = Number(searchState.lat);
        const lng = Number(searchState.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !searchState.lat) {
            return '';
        }

        return formatDistance(
            metresBetween({lat, lng}, {lat: object.latitude, lng: object.longitude}),
        );
    });

    let isCoordinateOnly = $derived(!object.categoryName && !object.name && !object.address);
    let address = $derived(composeAddress(object));
</script>

<Button
    variant="ghost"
    class={cn(
        'font-branding relative block h-auto w-full rounded-none px-3.5 py-2.5 text-left',
        // the row is full-bleed inside the list, so a focus ring would trace a box across it;
        // the keyboard's place in the list is painted instead, as a stronger shade of the hover
        // tint plus a marker on the edge the list is walked along
        'hover:bg-accent/50 dark:hover:bg-accent/40',
        'focus-visible:bg-accent/80 focus-visible:text-accent-foreground dark:focus-visible:bg-accent/60 focus-visible:ring-0',
        'before:bg-primary before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r-full before:opacity-0 before:transition-opacity focus-visible:before:opacity-100',
    )}
    onclick={onClick}
    onkeydown={handleKeydown}
    data-search-item
>
    {#if isCoordinateOnly}
        <div class="flex items-center justify-between gap-2">
            <div class="flex-1 truncate text-sm font-medium">
                {object.latitude.toFixed(5)}, {object.longitude.toFixed(5)}
            </div>
            {#if distance}
                <span class="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {distance}
                </span>
            {/if}
            {#if object.type === 'google'}
                <SvglGoogleLogo width={12} height={12} class="opacity-50" />
            {/if}
        </div>
    {:else}
        <div class="flex items-center justify-between gap-2">
            <div class="text-muted-foreground flex-1 truncate text-xs">
                {address}
            </div>
            {#if distance}
                <span class="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {distance}
                </span>
            {/if}
            {#if object.type === 'google'}
                <SvglGoogleLogo width={12} height={12} class="opacity-50" />
            {/if}
        </div>
        {#if object.categoryName}
            <CategoryBadge name={object.categoryName} size="sm" class="max-w-full" />
        {/if}
        {#if object.name}
            <div class="truncate text-sm">{object.name}</div>
        {/if}
    {/if}
</Button>
