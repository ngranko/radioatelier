<script lang="ts">
    import {browser} from '$app/environment';
    import {QueryClient, QueryClientProvider} from '@tanstack/svelte-query';
    import '../styles/app.css';
    import type RequestError from '$lib/errors/RequestError.ts';
    import ServerError from '$lib/errors/ServerError.ts';
    import {STATUS_TOO_MANY_REQUESTS} from '$lib/api/constants.ts';
    import config from '$lib/config';
    import {Toaster} from '$lib/components/ui/sonner';
    import type {Snippet} from 'svelte';
    interface Props {
        children?: Snippet;
    }

    let {children}: Props = $props();

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                enabled: browser,
                refetchOnWindowFocus: false,
                retry: (failureCount: number, error: RequestError | ServerError) =>
                    failureCount < config.queryRetryCount &&
                    (error instanceof ServerError || error.status === STATUS_TOO_MANY_REQUESTS),
                staleTime: 1000 * 20,
            },
        },
    });
</script>

<QueryClientProvider client={queryClient}>
    {@render children?.()}
    <Toaster
        position="top-center"
        richColors
        theme="light"
        toastOptions={{
            classes: {
                toast: 'bg-white',
                title: 'font-branding text-base',
                description: 'font-branding',
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
</QueryClientProvider>
