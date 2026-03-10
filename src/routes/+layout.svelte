<script lang="ts">
    import '../styles/app.css';
    import {Toaster} from '$lib/components/ui/sonner';
    import type {Snippet} from 'svelte';
    import {PUBLIC_CONVEX_URL} from '$env/static/public';
    import {setupConvex} from 'convex-svelte';
    import {ClerkProvider} from 'svelte-clerk';
    import ConvexClerkAuth from '$lib/components/convexClerkAuth.svelte';

    setupConvex(PUBLIC_CONVEX_URL);

    interface Props {
        children?: Snippet;
    }

    let {children}: Props = $props();
</script>

<ClerkProvider>
    <ConvexClerkAuth>
        {@render children?.()}
        <Toaster
            position="top-center"
            theme="light"
            toastOptions={{
                classes: {
                    title: 'font-branding text-base',
                    description: 'font-branding',
                    success: '[&_[data-icon]]:text-success',
                    error: '[&_[data-icon]]:text-destructive',
                    warning: '[&_[data-icon]]:text-warning',
                    info: '[&_[data-icon]]:text-primary',
                },
            }}
        >
            {#snippet loadingIcon()}
                <i class="fa-solid fa-circle-notch animate-spin text-base"></i>
            {/snippet}
            {#snippet successIcon()}
                <i class="fa-solid fa-circle-check text-base"></i>
            {/snippet}
            {#snippet errorIcon()}
                <i class="fa-solid fa-circle-xmark text-base"></i>
            {/snippet}
            {#snippet infoIcon()}
                <i class="fa-solid fa-circle-info text-base"></i>
            {/snippet}
            {#snippet warningIcon()}
                <i class="fa-solid fa-triangle-exclamation text-base"></i>
            {/snippet}
        </Toaster>
        <div id="portal"></div>
    </ConvexClerkAuth>
</ClerkProvider>
