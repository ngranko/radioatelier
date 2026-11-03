<script lang="ts">
    import ThemeSwitcher from '$lib/components/themeSwitcher.svelte';
    import {onMount} from 'svelte';
    import type {LayoutProps} from './$types';
    import Background from './background.svelte';

    let {children}: LayoutProps = $props();

    let mounted = $state(false);

    onMount(() => {
        mounted = true;
    });
</script>

<section
    aria-label="Вход"
    class="bg-background relative flex min-h-screen items-center justify-center overflow-hidden p-5"
>
    <div class="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
    </div>

    <Background />

    <div class="relative z-10 w-full max-w-[400px]">
        <div
            class="glass group relative overflow-hidden rounded-2xl bg-white/80 shadow-2xl ring-black/4 transition-[transform,opacity] duration-700 ease-out motion-reduce:transition-none dark:bg-white/6 dark:shadow-black/30 dark:ring-white/8 {mounted
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'}"
        >
            <div
                class="absolute inset-0 bg-linear-to-br from-white/50 via-transparent to-transparent dark:from-white/2"
            ></div>

            <div
                class="from-primary via-primary/70 absolute inset-x-0 top-0 h-[3px] bg-linear-to-r to-transparent"
            ></div>

            <div class="relative px-8 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10">
                {@render children?.()}
            </div>
        </div>
    </div>
</section>
