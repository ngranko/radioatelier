<script lang="ts">
    import {page} from '$app/state';
    import LogoMark from '$lib/components/branding/logoMark.svelte';
    import {Button} from '$lib/components/ui/button';
    import MapIcon from '@lucide/svelte/icons/map';
    import RotateCwIcon from '@lucide/svelte/icons/rotate-cw';
    import Background from './login/background.svelte';

    const isNotFound = $derived(page.status === 404);
    const detail = $derived(/[а-яё]/i.test(page.error?.message ?? '') ? page.error?.message : '');
</script>

<main class="bg-background relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
    <Background />

    <div
        class="bg-background surface-edge relative z-10 w-full max-w-100 overflow-hidden rounded-2xl px-8 pt-10 pb-8 text-center sm:px-10"
    >
        <div
            class="from-primary via-primary/70 absolute inset-x-0 top-0 h-0.75 bg-linear-to-r to-transparent"
        ></div>

        <LogoMark class="text-foreground mx-auto mb-6 h-7" />
        <p class="text-muted-foreground mb-2 text-sm tabular-nums">Ошибка {page.status}</p>
        <h1 class="text-foreground text-2xl font-semibold tracking-tight">
            {isNotFound ? 'Страница не найдена' : 'Что-то пошло не так'}
        </h1>
        <p class="text-muted-foreground mt-3 text-base text-pretty">
            {isNotFound
                ? 'Возможно, ссылка устарела или точка была удалена.'
                : 'Попробуйте повторить через несколько секунд.'}
        </p>
        {#if detail}
            <p class="text-muted-foreground/80 mt-2 text-sm">{detail}</p>
        {/if}

        <div class="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
            <Button href="/" size="lg" class="sm:flex-1">
                <MapIcon />
                На карту
            </Button>
            {#if !isNotFound}
                <Button
                    variant="outline"
                    size="lg"
                    class="sm:flex-1"
                    onclick={() => location.reload()}
                >
                    <RotateCwIcon />
                    Повторить
                </Button>
            {/if}
        </div>
    </div>
</main>
