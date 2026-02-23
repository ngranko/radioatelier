<script lang="ts">
    import type {OAuthStrategy} from '@clerk/types';
    import {useClerkContext} from 'svelte-clerk';
    import {toast} from 'svelte-sonner';
    import {page} from '$app/state';
    import {normalizeRef} from '$lib/utils';
    import LoadingDots from '$lib/components/loadingDots.svelte';
    import Button from '$lib/components/ui/button/button.svelte';

    type ClerkWithEnvironment = typeof ctx.clerk & {
        __unstable__environment?: {
            userSettings?: {
                socialProviderStrategies?: OAuthStrategy[];
            };
        };
    };

    const ctx = useClerkContext();

    let oauthLoading = $state<OAuthStrategy | null>(null);

    const enabledStrategies = $derived.by(() => {
        if (!ctx.isLoaded || !ctx.clerk) {
            return [];
        }
        const clerk = ctx.clerk as ClerkWithEnvironment;
        return clerk.__unstable__environment?.userSettings?.socialProviderStrategies ?? [];
    });

    async function signInWithOAuth(strategy: OAuthStrategy) {
        if (!ctx.clerk || !ctx.isLoaded || !ctx.clerk.client) {
            console.error(
                'failed loading clerk for auth',
                ctx.clerk,
                ctx.isLoaded,
                ctx.clerk?.client,
            );
            toast.error('Что-то пошло не так, попробуйте позже');
            return;
        }

        oauthLoading = strategy;

        try {
            await ctx.clerk.client.signIn.authenticateWithRedirect({
                strategy,
                redirectUrl: '/login/sso-callback',
                redirectUrlComplete: normalizeRef(page.url.searchParams.get('ref'), page.url.href),
            });
        } catch (err: unknown) {
            const clerkError = err as {errors?: Array<{code: string; message: string}>};
            const errorMessage = clerkError.errors?.[0]?.message || 'Не удалось войти';
            toast.error(errorMessage);
            oauthLoading = null;
        }
    }
</script>

<div
    class="grid transition-[grid-template-rows,opacity] duration-500 ease-out {enabledStrategies.length >
    0
        ? 'grid-rows-[1fr] opacity-100'
        : 'grid-rows-[0fr] opacity-0'}"
>
    <div class="overflow-hidden">
        <div class="mt-6 flex flex-col gap-3">
            {#if enabledStrategies.includes('oauth_google')}
                <Button
                    variant="outline"
                    size="lg"
                    class="hover:bg-muted/50 active:bg-muted w-full gap-3 bg-white/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5 dark:hover:bg-white/10"
                    disabled={Boolean(oauthLoading)}
                    onclick={() => signInWithOAuth('oauth_google')}
                    aria-label="Войти с Google"
                >
                    {#if oauthLoading === 'oauth_google'}
                        <LoadingDots />
                    {:else}
                        <i class="fa-brands fa-google text-lg"></i>
                        <span>Войти с Google</span>
                    {/if}
                </Button>
            {/if}

            {#if enabledStrategies.includes('oauth_apple')}
                <Button
                    variant="outline"
                    size="lg"
                    class="hover:bg-muted/50 active:bg-muted w-full gap-3 bg-white/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5 dark:hover:bg-white/10"
                    disabled={Boolean(oauthLoading)}
                    onclick={() => signInWithOAuth('oauth_apple')}
                    aria-label="Войти с Apple"
                >
                    {#if oauthLoading === 'oauth_apple'}
                        <LoadingDots />
                    {:else}
                        <i class="fa-brands fa-apple text-lg"></i>
                        <span>Войти с Apple</span>
                    {/if}
                </Button>
            {/if}

            {#if enabledStrategies.includes('oauth_github')}
                <Button
                    variant="outline"
                    size="lg"
                    class="hover:bg-muted/50 active:bg-muted w-full gap-3 bg-white/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5 dark:hover:bg-white/10"
                    disabled={Boolean(oauthLoading)}
                    onclick={() => signInWithOAuth('oauth_github')}
                    aria-label="Войти с GitHub"
                >
                    {#if oauthLoading === 'oauth_github'}
                        <LoadingDots />
                    {:else}
                        <i class="fa-brands fa-github text-lg"></i>
                        <span>Войти с GitHub</span>
                    {/if}
                </Button>
            {/if}
        </div>
    </div>
</div>
