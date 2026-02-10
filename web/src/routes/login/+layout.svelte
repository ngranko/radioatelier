<script lang="ts">
    import {onMount} from 'svelte';
    import Background from './background.svelte';
    import type {LayoutProps} from './$types';

    let {children}: LayoutProps = $props();

    let mounted = $state(false);

    onMount(() => {
        mounted = true;
    });
</script>

<section
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[oklch(0.985_0.005_260)] p-5 dark:bg-[oklch(0.12_0.03_260)]"
>
    <Background />

    <div class="relative z-10 w-full max-w-[400px]">
        <div
            class="group relative overflow-hidden rounded-2xl bg-white/80 shadow-2xl shadow-black/[0.08] ring-1 ring-black/[0.04] backdrop-blur-xl dark:bg-white/[0.06] dark:shadow-black/30 dark:ring-white/[0.08] transition-all duration-700 ease-out {mounted
                ? 'translate-y-0 opacity-100'
                : 'translate-y-6 opacity-0'}"
        >
            <div
                class="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent dark:from-white/[0.02]"
            ></div>

            <div
                class="from-primary via-primary/70 absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r to-transparent"
            ></div>

            <div class="relative px-8 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10">
                {@render children?.()}
            </div>
        </div>
    </div>
</section>
