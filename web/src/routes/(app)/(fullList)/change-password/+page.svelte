<script lang="ts">
    import {cubicInOut} from 'svelte/easing';
    import {type Component, onMount} from 'svelte';
    import {toast} from 'svelte-sonner';
    import Loader from '$lib/components/loader.svelte';
    import {fade} from 'svelte/transition';

    let isOpen = $state(true);
    let isLoading = $state(true);
    let PasswordChangeDialog: Component<{isOpen: boolean}> | undefined = $state();

    onMount(async () => {
        if (!PasswordChangeDialog) {
            isLoading = true;
            try {
                const {default: Component} = await import('./passwordChangeDialog.svelte');
                PasswordChangeDialog = Component;
            } catch (error) {
                toast.error('Что-то пошло не так');
            }
            isLoading = false;
        }
    });
</script>

{#if isLoading}
    <div
        class="fixed inset-0 z-2 flex items-center justify-center bg-black/30"
        transition:fade={{duration: 100, easing: cubicInOut}}
    >
        <Loader />
    </div>
{/if}

{#if PasswordChangeDialog}
    <PasswordChangeDialog bind:isOpen />
{/if}
