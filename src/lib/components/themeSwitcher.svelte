<script lang="ts">
    import {themeState, setTheme, type ThemePreference} from '$lib/state/theme.svelte';

    const options: {value: ThemePreference; label: string; icon: string}[] = [
        {value: 'light', label: 'Светлая', icon: 'fa-sun'},
        {value: 'system', label: 'Системная', icon: 'fa-circle-half-stroke'},
        {value: 'dark', label: 'Тёмная', icon: 'fa-moon'},
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
            class="relative rounded-md px-3 py-1.5 text-xs transition-all
                {themeState.preference === option.value
                ? 'text-foreground bg-white shadow-sm dark:bg-white/15 dark:text-white'
                : 'text-foreground/50 hover:text-foreground/80 dark:text-white/40 dark:hover:text-white/70'}"
        >
            <i class="fa-solid {option.icon}"></i>
        </button>
    {/each}
</div>
