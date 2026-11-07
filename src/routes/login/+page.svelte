<script lang="ts">
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {normalizeRef} from '$lib/utils';
    import {useClerkContext} from 'svelte-clerk';
    import LoginForm from './loginForm.svelte';
    import Logo from './logo.svelte';
    import SecondFactorForm from './secondFactorForm.svelte';
    import SsoButtons from './ssoButtons.svelte';

    const ctx = useClerkContext();
    let needsSecondFactor = $state(false);
    let hasCheckedExistingSession = false;

    // On a client-side navigation the server can read an expired session cookie (a
    // backgrounded tab stops refreshing it) and send a signed-in user here. Checked once
    // on load so it does not race the sign-in forms' own redirect.
    $effect(() => {
        if (!ctx.isLoaded || hasCheckedExistingSession) {
            return;
        }
        hasCheckedExistingSession = true;
        if (ctx.session?.status === 'active') {
            returnToRef();
        }
    });

    async function returnToRef() {
        // A forced refresh rewrites the session cookie, so the server agrees on the way back.
        await ctx.session?.getToken({skipCache: true});
        await goto(normalizeRef(page.url.searchParams.get('ref'), page.url.href), {
            replaceState: true,
        });
    }
</script>

<div class="mb-10 text-center">
    <Logo class="mb-4 flex items-center justify-center gap-3 text-3xl" />
    <p class="text-muted-foreground/70 text-sm tracking-wide">
        {needsSecondFactor ? 'Подтверждение входа' : 'Вход в систему'}
    </p>
</div>

{#if needsSecondFactor}
    <SecondFactorForm onBack={() => (needsSecondFactor = false)} />
{:else}
    <LoginForm onNeedsSecondFactor={() => (needsSecondFactor = true)} />

    <SsoButtons />
{/if}
