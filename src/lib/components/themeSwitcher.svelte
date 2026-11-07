<script lang="ts" module>
    import type {ThemePreference} from '$lib/state/theme.svelte';

    export const themeLabels: Record<ThemePreference, string> = {
        light: 'Светлая',
        system: 'Системная',
        dark: 'Тёмная',
    };
</script>

<script lang="ts">
    import {themeState, setTheme} from '$lib/state/theme.svelte';
    import MoonIcon from '@lucide/svelte/icons/moon';
    import SunIcon from '@lucide/svelte/icons/sun';
    import SunMoonIcon from '@lucide/svelte/icons/sun-moon';
    import type {Component} from 'svelte';

    const options: {value: ThemePreference; icon: Component<{class?: string}>}[] = [
        {value: 'light', icon: SunIcon},
        {value: 'system', icon: SunMoonIcon},
        {value: 'dark', icon: MoonIcon},
    ];
</script>

<div
    class="inline-flex items-center gap-0.5 rounded-lg bg-black/6 p-0.5 dark:bg-white/8"
    role="radiogroup"
    aria-label="Выбор темы"
>
    {#each options as option (option.value)}
        <button
            role="radio"
            aria-checked={themeState.preference === option.value}
            aria-label={themeLabels[option.value]}
            title={themeLabels[option.value]}
            onclick={() => setTheme(option.value)}
            class="relative rounded-md px-2.5 py-1.5 transition-all duration-200 pointer-coarse:px-3.5 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:inset-y-[calc(50%-22px)]
                {themeState.preference === option.value
                ? 'text-primary dark:text-primary bg-white shadow-sm dark:bg-white/15'
                : 'text-foreground/60 hover:text-foreground/85 dark:text-white/55 dark:hover:text-white/80'}"
        >
            <option.icon class="size-4" />
        </button>
    {/each}
</div>
