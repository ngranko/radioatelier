<script lang="ts">
    import {goto} from '$app/navigation';
    import {Root as DialogRoot} from '$lib/components/ui/dialog';
    import type {Snippet} from 'svelte';

    const DIALOG_ANIMATION_DURATION = 200;

    interface Props {
        isOpen: boolean;
        children: Snippet;
    }

    let {isOpen = $bindable(), children}: Props = $props();

    // The dialog is its own route, so closing it leaves the route — but only
    // once the close animation has played. Reopening or unmounting first
    // cancels the pending navigation through the effect cleanup.
    $effect(() => {
        if (isOpen) {
            return;
        }
        const timer = setTimeout(() => goto('/'), DIALOG_ANIMATION_DURATION);
        return () => clearTimeout(timer);
    });
</script>

<DialogRoot bind:open={isOpen}>
    {@render children()}
</DialogRoot>
