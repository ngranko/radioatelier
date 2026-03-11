<script lang="ts">
    import type {SearchItem} from '$lib/interfaces/object';
    import {Button} from '$lib/components/ui/button';

    let {object, onClick}: {object: SearchItem; onClick: () => void} = $props();

    function composeAddress(object: SearchItem) {
        let result = object.address;

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

    let isCoordinateOnly = $derived(!object.categoryName && !object.name && !object.address);
    let address = $derived(composeAddress(object));
</script>

<Button
    variant="ghost"
    class="font-branding block h-auto w-full rounded-none px-3.5 py-2.5 text-left"
    onclick={onClick}
>
    {#if isCoordinateOnly}
        <div class="flex items-center justify-between gap-2">
            <div class="flex-1 truncate text-sm font-medium">
                {object.latitude.toFixed(5)}, {object.longitude.toFixed(5)}
            </div>
            {#if object.type === 'google'}
                <i class="fa-brands fa-google text-xs opacity-50"></i>
            {/if}
        </div>
    {:else}
        <div class="flex items-center justify-between gap-2">
            <div class="text-muted-foreground flex-1 truncate text-xs">
                {address}
            </div>
            {#if object.type === 'google'}
                <i class="fa-brands fa-google text-xs opacity-50"></i>
            {/if}
        </div>
        {#if object.categoryName}
            <div class="text-primary/80 truncate text-xs font-bold">
                {object.categoryName}
            </div>
        {/if}
        {#if object.name}
            <div class="truncate text-sm">{object.name}</div>
        {/if}
    {/if}
</Button>
