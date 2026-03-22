<script lang="ts">
    import {themeState, setTheme, type ThemePreference} from '$lib/state/theme.svelte';
    import SunMoonIcon from '@lucide/svelte/icons/sun-moon';
    import SunIcon from '@lucide/svelte/icons/sun';
    import MoonIcon from '@lucide/svelte/icons/moon';
    import type {Component} from 'svelte';

    const options: {value: ThemePreference; label: string; icon: Component<{class?: string}>}[] = [
        {value: 'light', label: 'Светлая', icon: SunIcon},
        {value: 'system', label: 'Системная', icon: SunMoonIcon},
        {value: 'dark', label: 'Тёмная', icon: MoonIcon},
    ];
</script>

<div
    class="inline-flex items-center gap-0.5 rounded-lg bg-black/[0.06] p-0.5 dark:bg-white/[0.08]"
    role="radiogroup"
    aria-label="Выбор темы"
>
    {#each options as option (option.value)}
        <button
            role="radio"
            aria-checked={themeState.preference === option.value}
            aria-label={option.label}
            onclick={() => setTheme(option.value)}
            class="relative rounded-md px-2.5 py-1.5 transition-all duration-200
                {themeState.preference === option.value
                ? 'text-primary dark:text-primary bg-white shadow-sm dark:bg-white/15'
                : 'text-foreground/60 hover:text-foreground/85 dark:text-white/55 dark:hover:text-white/80'}"
        >
            <option.icon class="size-4" />
        </button>
    {/each}
</div>
