<script lang="ts">
    import {onDestroy} from 'svelte';
    import {page} from '$app/state';
    import {goto} from '$app/navigation';
    import {useClerkContext} from 'svelte-clerk';
    import {normalizeRef} from '$lib/utils';
    import {Button} from '$lib/components/ui/button';
    import Logo from '../logo.svelte';
    import Background from '../background.svelte';

    const ctx = useClerkContext();
    let taskContainer: HTMLDivElement | null = $state(null);
    let taskMounted = $state(false);

    const redirectUrl = $derived(normalizeRef(page.url.searchParams.get('ref')));
    const hasResetTask = $derived(ctx.clerk?.session?.currentTask?.key === 'reset-password');

    $effect(() => {
        if (taskMounted || !ctx.isLoaded || !ctx.clerk || !taskContainer || !hasResetTask) {
            return;
        }

        ctx.clerk.mountTaskResetPassword(taskContainer, {
            redirectUrlComplete: redirectUrl,
        });
        taskMounted = true;
    });

    onDestroy(() => {
        if (!taskMounted || !taskContainer || !ctx.clerk) {
            return;
        }
        ctx.clerk.unmountTaskResetPassword(taskContainer);
    });
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

                <div class="space-y-4">
                    <p class="text-muted-foreground text-center text-sm">
                        Для защиты аккаунта нужно обновить пароль перед входом.
                    </p>
                    <div bind:this={taskContainer}></div>

                    {#if ctx.isLoaded && !hasResetTask}
                        <p class="text-muted-foreground text-center text-sm">
                            Нет активной задачи смены пароля.
                        </p>
                        <Button
                            type="button"
                            class="w-full text-base"
                            onclick={() => goto(redirectUrl)}
                        >
                            Вернуться
                        </Button>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</section>
