<script lang="ts">
    import {cubicInOut} from 'svelte/easing';
    import {fade} from 'svelte/transition';
    import {portal} from 'svelte-portal';

    interface Props {
        isOpen?: boolean;
        children?: import('svelte').Snippet;
        onClose(): void;
    }

    let {isOpen = $bindable(false), children, onClose}: Props = $props();

    let dialogRef: HTMLElement | undefined = $state();

    function handleClose(event: Event) {
        if (dialogRef?.contains(event.target as Node)) {
            return;
        }
        onClose();
    }
</script>

{#if isOpen}
    <div
        class="backdrop"
        role="none"
        onclick={handleClose}
        transition:fade={{duration: 200, easing: cubicInOut}}
        use:portal={'#portal'}
    >
        <div bind:this={dialogRef} role="document" class="dialog">
            {@render children?.()}
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
