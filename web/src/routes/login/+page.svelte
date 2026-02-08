<script lang="ts">
    import Logo from './logo.svelte';
    import Background from './background.svelte';
    import LoginForm from './loginForm.svelte';
    import SecondFactorForm from './secondFactorForm.svelte';
    import SsoButtons from './ssoButtons.svelte';

    let needsSecondFactor = $state(false);
</script>

<section
    class="from-muted via-background to-muted relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br p-6 dark:from-[oklch(0.129_0.042_264.695)] dark:via-[oklch(0.15_0.03_260)] dark:to-[oklch(0.129_0.042_264.695)]"
>
    <Background />

    <div class="relative z-10 w-full max-w-sm">
        <div
            class="bg-card ring-border relative overflow-hidden rounded-lg shadow-xl ring-1 shadow-black/5 dark:bg-white/10 dark:ring-white/20 dark:backdrop-blur-md dark:shadow-black/20 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        >
            <div
                class="from-primary to-primary/50 absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r"
            ></div>
            <div class="px-8 py-10 sm:px-10 sm:py-12">
                <div class="mb-8 text-center">
                    <Logo class="mb-3 flex items-center justify-center gap-3 text-3xl" />
                </div>

                {#if needsSecondFactor}
                    <SecondFactorForm onBack={() => (needsSecondFactor = false)} />
                {:else}
                    <LoginForm onNeedsSecondFactor={() => (needsSecondFactor = true)} />

                    <SsoButtons />
                {/if}
            </div>
        </div>
    </div>
</section>
