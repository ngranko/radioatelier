<script lang="ts">
    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import {onMount} from 'svelte';
    import {registerEscapeCloseHandler} from '$lib/utils/escapeClose';

    interface Props {
        isOpen: boolean;
        url: string;
    }

    let {isOpen = $bindable(), url = $bindable()}: Props = $props();

    function handleClose() {
        isOpen = false;
    }

    onMount(() =>
        registerEscapeCloseHandler({
            priority: 30,
            isActive: () => isOpen,
            close: handleClose,
        }),
    );
</script>

{#if isOpen}
    <button
        class="fixed inset-0 z-10 flex items-center justify-center border-none bg-black/50"
        onclick={handleClose}
        transition:fade={{duration: 100, easing: cubicInOut}}
        type="button"
    >
        <img class="max-h-full max-w-full" src={url} alt="Изображение" />
    </button>
{/if}
