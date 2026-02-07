<script lang="ts">
    import {useConvexClient} from 'convex-svelte';
    import {useClerkContext} from 'svelte-clerk';
    import type {Snippet} from 'svelte';

    interface Props {
        children?: Snippet;
    }

    let {children}: Props = $props();

    const convexClient = useConvexClient();
    const clerkCtx = useClerkContext();

    $effect(() => {
        if (!clerkCtx.isLoaded) return;

        if (clerkCtx.auth.userId) {
            convexClient.setAuth(async ({forceRefreshToken}) => {
                try {
                    const token = await clerkCtx.session?.getToken({
                        template: 'convex',
                        skipCache: forceRefreshToken,
                    });
                    return token ?? null;
                } catch {
                    return null;
                }
            });
        } else {
            convexClient.client.clearAuth();
        }
    });
</script>

{@render children?.()}
