<script lang="ts">
    import Logo from './logo.svelte';
    import LoginForm from './loginForm.svelte';
    import SecondFactorForm from './secondFactorForm.svelte';
    import SsoButtons from './ssoButtons.svelte';

    let needsSecondFactor = $state(false);
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
