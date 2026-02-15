<script lang="ts">
    import {browser} from '$app/environment';
    import {useConvexClient} from 'convex-svelte';
    import {useClerkContext} from 'svelte-clerk';
    import type {Snippet} from 'svelte';

    interface Props {
        children?: Snippet;
    }

    let {children}: Props = $props();

    const convexClient = useConvexClient();
    const clerkCtx = useClerkContext();
    let authInitialized = $state(!browser);
    let appliedAuthUserId = $state<string | null | undefined>(undefined);

    $effect(() => {
        if (!clerkCtx.isLoaded) {
            return;
        }

        const nextAuthUserId = clerkCtx.auth.userId ?? null;
        if (nextAuthUserId === appliedAuthUserId) {
            authInitialized = true;
            return;
        }

        if (nextAuthUserId) {
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

        appliedAuthUserId = nextAuthUserId;
        authInitialized = true;
    });
</script>

{#if authInitialized}
    {@render children?.()}
{:else}
    <div class="flex min-h-24 items-center justify-center py-6">
        <div class="flex items-center gap-3 text-sm text-muted-foreground">
            <span
                class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
            ></span>
            <span>Загрузка...</span>
        </div>
    </div>
{/if}
