<script lang="ts">
    import {browser} from '$app/environment';
    import {QueryClient, QueryClientProvider} from '@tanstack/svelte-query';
    import '../styles/global.scss';
    import type RequestError from '$lib/errors/RequestError';
    import ServerError from '$lib/errors/ServerError';
    import {STATUS_TOO_MANY_REQUESTS} from '$lib/api/constants';
    import config from '$lib/config';

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
    })
</script>

<QueryClientProvider client={queryClient}>
    <slot />
</QueryClientProvider>
