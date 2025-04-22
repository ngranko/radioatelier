<script lang="ts">
    import ClearButton from '$lib/components/search/clearButton.svelte';

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
    }
</script>

<div class="container">
    <input type="text" placeholder="Искать..." oninput={handleInput} bind:this={inputRef} />
    {#if val}
        <ClearButton onClick={handleClearClick} />
    {/if}
</div>

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .container {
        position: relative;
        z-index: 1;
    }

    input {
        @include typography.brand-face;
        @include typography.size-16;
        position: relative;
        width: 100%;
        height: 100%;
        padding: 10px 42px 10px 18px;
        border: none;
        border-radius: 40px;
        background-color: white;
        box-shadow: 0 0 2px colors.$transparentBlack;
    }
</style>
