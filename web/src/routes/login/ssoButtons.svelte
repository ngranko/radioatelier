<script lang="ts">
    import type {OAuthStrategy} from '@clerk/types';
    import {useClerkContext} from 'svelte-clerk';
    import SsoButton from './ssoButton.svelte';
    import {toast} from 'svelte-sonner';
    import {page} from '$app/state';
    import {normalizeRef} from '$lib/utils';

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
        if (!ctx.isLoaded) {
            return [];
        }

        return getEnabledStrategies();
    });

    const hasGoogle = $derived(enabledStrategies.includes('oauth_google'));
    const hasApple = $derived(enabledStrategies.includes('oauth_apple'));
    const hasGithub = $derived(enabledStrategies.includes('oauth_github'));

    const hasAnySocialProvider = $derived(hasGoogle || hasApple || hasGithub);

    function getEnabledStrategies(): OAuthStrategy[] {
        if (!ctx.isLoaded || !ctx.clerk) {
            return [];
        }

        const clerk = ctx.clerk as ClerkWithEnvironment;
        return clerk.__unstable__environment?.userSettings?.socialProviderStrategies ?? [];
    }

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
                redirectUrlComplete: normalizeRef(page.url.searchParams.get('ref')),
            });
        } catch (err: unknown) {
            const clerkError = err as {errors?: Array<{code: string; message: string}>};
            const errorMessage = clerkError.errors?.[0]?.message || 'Не удалось войти';
            toast.error(errorMessage);
            oauthLoading = null;
        }
    }
</script>

{#if hasAnySocialProvider}
    <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
            <span class="bg-border w-full border-t"></span>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-card px-2 text-muted-foreground dark:bg-transparent">или</span>
        </div>
    </div>

    <div class="flex flex-col gap-3">
        {#if hasGoogle}
            <SsoButton
                disabled={Boolean(oauthLoading)}
                onclick={() => signInWithOAuth('oauth_google')}
                ariaLabel="Войти с Google"
                loading={oauthLoading === 'oauth_google'}
            >
                <i class="fa-brands fa-google"></i>
                Google
            </SsoButton>
        {/if}
        {#if hasApple}
            <SsoButton
                disabled={Boolean(oauthLoading)}
                onclick={() => signInWithOAuth('oauth_apple')}
                ariaLabel="Войти с Apple"
                loading={oauthLoading === 'oauth_apple'}
            >
                <i class="fa-brands fa-apple"></i>
                Apple
            </SsoButton>
        {/if}
        {#if hasGithub}
            <SsoButton
                disabled={Boolean(oauthLoading)}
                onclick={() => signInWithOAuth('oauth_github')}
                ariaLabel="Войти с GitHub"
                loading={oauthLoading === 'oauth_github'}
            >
                <i class="fa-brands fa-github"></i>
                GitHub
            </SsoButton>
        {/if}
    </div>
{/if}
