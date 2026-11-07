<script lang="ts">
    import ThemeSwitcher, {themeLabels} from '$lib/components/themeSwitcher.svelte';
    import {themeState} from '$lib/state/theme.svelte';
</script>

<div class="flex items-center justify-between gap-3 py-1 pr-1 pl-2">
    <div class="flex flex-col text-sm/tight">
        <span class="text-muted-foreground">Тема</span>
        <span class="text-foreground text-xs/tight">{themeLabels[themeState.preference]}</span>
    </div>
    <ThemeSwitcher />
</div>
