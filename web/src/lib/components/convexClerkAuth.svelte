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
    let appliedAuthUserId = $state<string | null | undefined>(undefined);

    $effect(() => {
        if (!clerkCtx.isLoaded) {
            return;
        }

        const nextAuthUserId = clerkCtx.auth.userId ?? null;
        if (nextAuthUserId === appliedAuthUserId) {
            return;
        }

        if (nextAuthUserId) {
            convexClient.setAuth(async ({forceRefreshToken}) => {
                try {
                    if (!clerkCtx.session) {
                        console.warn('Convex token fetch skipped: Clerk session is unavailable');
                        return null;
                    }
                    const token = await clerkCtx.session.getToken({
                        template: 'convex',
                        skipCache: forceRefreshToken,
                    });
                    return token ?? null;
                } catch (err) {
                    console.error('Failed to fetch Clerk token for Convex', err);
                    return null;
                }
            });
        } else {
            convexClient.client.clearAuth();
        }

        appliedAuthUserId = nextAuthUserId;
    });
</script>

{@render children?.()}
