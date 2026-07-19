<script lang="ts">
    import '../styles/app.css';
    import {PUBLIC_CONVEX_URL} from '$env/static/public';
    import ConvexClerkAuth from '$lib/components/convexClerkAuth.svelte';
    import {Toaster} from '$lib/components/ui/sonner';
    import {initTheme, themeState} from '$lib/state/theme.svelte';
    import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
    import CircleXMarkIcon from '@lucide/svelte/icons/circle-x';
    import InfoIcon from '@lucide/svelte/icons/info';
    import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
    import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
    import {setupConvex} from 'convex-svelte';
    import type {Snippet} from 'svelte';
    import {onMount} from 'svelte';
    import {ClerkProvider} from 'svelte-clerk';

    setupConvex(PUBLIC_CONVEX_URL);

    onMount(() => {
        initTheme();
    });

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
            theme={themeState.resolved}
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
                <LoaderCircleIcon class="size-5 animate-spin" />
            {/snippet}
            {#snippet successIcon()}
                <CheckCircleIcon class="size-5" />
            {/snippet}
            {#snippet errorIcon()}
                <CircleXMarkIcon class="size-5" />
            {/snippet}
            {#snippet infoIcon()}
                <InfoIcon class="size-5" />
            {/snippet}
            {#snippet warningIcon()}
                <TriangleAlertIcon class="size-5" />
            {/snippet}
        </Toaster>
        <div id="portal"></div>
    </ConvexClerkAuth>
</ClerkProvider>
