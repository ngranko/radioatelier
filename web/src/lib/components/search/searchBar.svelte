<script lang="ts">
    import ClearButton from '$lib/components/search/clearButton.svelte';
    import {searchPointList} from '$lib/stores/map';

    let {query = $bindable()} = $props();

    let inputRef: HTMLInputElement | undefined = $state();
    let val: string = $state('');
    let timeout: number | undefined;

    function handleInput(evt: Event) {
        val = (evt.target as HTMLInputElement).value;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            query = (evt.target as HTMLInputElement).value;
        }, 400);
    }

    function handleClearClick() {
        query = '';
        val = '';
        inputRef!.value = '';
        searchPointList.clear();
    }
</script>

<div class="relative z-1">
    <input
        type="text"
        placeholder="Искать..."
        oninput={handleInput}
        bind:this={inputRef}
        class="font-branding text-base relative w-full h-full pt-2 pr-10 pb-2 pl-4 border-none rounded-4xl bg-white shadow-sm"
    />
    {#if val}
        <ClearButton onClick={handleClearClick} />
    {/if}
</div>
