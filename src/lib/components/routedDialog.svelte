<script lang="ts">
    import {goto} from '$app/navigation';
    import CloseConfirmDialog from '$lib/components/objectDetails/closeConfirmDialog.svelte';
    import {Root as DialogRoot} from '$lib/components/ui/dialog';
    import type {Snippet} from 'svelte';

    const DIALOG_ANIMATION_DURATION = 200;

    interface Props {
        isOpen: boolean;
        hasUnsavedChanges?: boolean;
        children: Snippet;
    }

    let {isOpen = $bindable(), hasUnsavedChanges = false, children}: Props = $props();

    let isCloseConfirmOpen = $state(false);

    // The ✕, the footer close, Escape and the backdrop all close through the
    // root, so guarding its setter covers every way of dismissing the dialog.
    function requestOpenChange(open: boolean) {
        if (!open && hasUnsavedChanges) {
            isCloseConfirmOpen = true;
            return;
        }
        isOpen = open;
    }

    function confirmClose() {
        isCloseConfirmOpen = false;
        isOpen = false;
    }

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

<DialogRoot bind:open={() => isOpen, requestOpenChange}>
    {@render children()}
</DialogRoot>
<CloseConfirmDialog
    bind:open={isCloseConfirmOpen}
    title="Вы действительно хотите закрыть окно?"
    onConfirmClose={confirmClose}
/>
