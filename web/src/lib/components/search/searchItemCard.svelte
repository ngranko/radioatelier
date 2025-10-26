<script lang="ts">
    import type {SearchItem} from '$lib/interfaces/object';
    import {Button} from '$lib/components/ui/button';

    let {object, onClick} = $props();

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
</script>

<Button
    variant="ghost"
    class="font-branding block h-auto w-full pt-1 pr-3 pb-1 pl-3 text-left transition-colors last:rounded-b-lg"
    onclick={onClick}
>
    {#if !object.categoryName && !object.name && !object.address}
        <div class="flex items-center justify-between gap-2">
            <div class="flex-1 overflow-hidden text-base/7 text-ellipsis whitespace-nowrap">
                {object.latitude}, {object.longitude}
            </div>
            {#if object.type === 'google'}
                <i class="fa-brands fa-google opacity-50"></i>
            {/if}
        </div>
    {:else}
        <div class="flex items-center justify-between gap-2">
            <div
                class="flex-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap text-gray-400"
            >
                {composeAddress(object)}
            </div>
            {#if object.type === 'google'}
                <i class="fa-brands fa-google opacity-50"></i>
            {/if}
        </div>
        <div class="overflow-hidden text-sm font-bold text-ellipsis whitespace-nowrap">
            {object.categoryName}
        </div>
        <div class="flex-1 overflow-hidden text-base/7 text-ellipsis whitespace-nowrap">
            {object.name}
        </div>
    {/if}
</Button>
