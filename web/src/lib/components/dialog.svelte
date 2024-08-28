<script lang="ts">
    import {cubicInOut} from 'svelte/easing';
    import {fade} from 'svelte/transition';
    import {createEventDispatcher} from 'svelte';

    const dispatch = createEventDispatcher();

    export let isOpen: boolean = false;

    function handleClose() {
        dispatch('close');
    }
</script>

{#if isOpen}
    <div
        class="backdrop"
        role="none"
        on:click={handleClose}
        transition:fade={{duration: 200, easing: cubicInOut}}
    >
        <div role="document" class="dialog" on:click|stopPropagation>
            <slot />
        </div>
    </div>
{/if}

<style lang="scss">
    @use '../../styles/colors';

    .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-color: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
    }

    .dialog {
        max-width: calc(100dvw - 32px);
        max-height: calc(100dvh - 32px);
        padding: 24px;
        border: 0;
        border-radius: 8px;
        background-color: colors.$white;
        overflow: auto;
        transition:
            width 0.2s ease-in-out,
            height 0.2s ease-in-out;
    }
</style>
