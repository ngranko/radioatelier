<script lang="ts">
    import {page} from '$app/state';
    import {goto} from '$app/navigation';
    import {useClerkContext} from 'svelte-clerk';
    import {normalizeRef} from '$lib/utils';
    import Logo from '../logo.svelte';
    import {Button} from '$lib/components/ui/button';

    const ctx = useClerkContext();
    let taskContainer: HTMLDivElement | null = $state(null);

    const redirectUrl = $derived(normalizeRef(page.url.searchParams.get('ref'), page.url.href));
    const hasResetTask = $derived(ctx.clerk?.session?.currentTask?.key === 'reset-password');

    $effect(() => {
        if (!ctx.isLoaded || !ctx.clerk || !taskContainer || !hasResetTask) {
            return;
        }

        const clerk = ctx.clerk;
        const container = taskContainer;

        clerk.mountTaskResetPassword(container, {
            redirectUrlComplete: redirectUrl,
        });

        return () => {
            clerk.unmountTaskResetPassword(container);
        };
    });
</script>

<div class="mb-10 text-center">
    <Logo class="mb-4 flex items-center justify-center gap-3 text-3xl" />
    <p class="text-muted-foreground/70 text-sm tracking-wide">Обновление пароля</p>
</div>

<div class="space-y-6">
    <div
        class="bg-warning/10 dark:bg-warning/15 border-warning/30 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border"
    >
        <i class="fa-solid fa-lock text-warning text-2xl"></i>
    </div>

    <p class="text-muted-foreground text-center text-sm leading-relaxed">
        Для защиты аккаунта необходимо обновить пароль перед входом.
    </p>

    <div bind:this={taskContainer}></div>

    {#if ctx.isLoaded && !hasResetTask}
        <div class="space-y-4">
            <p class="text-muted-foreground text-center text-sm">
                Нет активной задачи смены пароля.
            </p>
            <Button type="button" size="lg" class="w-full" onclick={() => goto(redirectUrl)}>
                Вернуться
            </Button>
        </div>
    {/if}
</div>
