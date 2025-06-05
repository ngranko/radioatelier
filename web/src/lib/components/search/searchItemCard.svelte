<script lang="ts">
    import type {SearchItem} from '$lib/interfaces/object';

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

<button
    class="font-branding w-full pt-1 pl-3 pb-1 last:pb-2 pr-3 bg-transparent hover:bg-gray-100 last:rounded-b-lg border-none text-left cursor-pointer transition-colors"
    onclick={onClick}
>
    {#if !object.categoryName && !object.name && !object.address}
        <div class="flex justify-between items-center gap-2">
            <div class="text-base/7 flex-1 whitespace-nowrap text-ellipsis overflow-hidden">
                {object.latitude}, {object.longitude}
            </div>
            {#if object.type === 'google'}
                <i class="fa-brands fa-google opacity-50"></i>
            {/if}
        </div>
    {:else}
        <div class="flex justify-between items-center gap-2">
            <div
                class="text-sm flex-1 whitespace-nowrap text-ellipsis overflow-hidden text-gray-400"
            >
                {composeAddress(object)}
            </div>
            {#if object.type === 'google'}
                <i class="fa-brands fa-google opacity-50"></i>
            {/if}
        </div>
        <div class="text-sm font-bold whitespace-nowrap text-ellipsis overflow-hidden">
            {object.categoryName}
        </div>
        <div class="text-base/7 flex-1 whitespace-nowrap text-ellipsis overflow-hidden">
            {object.name}
        </div>
    {/if}
</button>
