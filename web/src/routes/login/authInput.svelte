<script lang="ts">
    import type {HTMLInputAttributes} from 'svelte/elements';

    interface Props extends Omit<HTMLInputAttributes, 'class'> {
        hasError?: boolean;
        value?: string;
    }

    let {hasError = false, value = $bindable(''), ...rest}: Props = $props();
</script>

<input
    class="bg-background/50 ring-ring/20 placeholder:text-muted-foreground/40 focus:border-primary focus:ring-primary/20 dark:bg-background/30 h-12 w-full rounded-xl border px-4 text-base outline-none ring-0 transition-all duration-200 focus:ring-4 dark:focus:ring-2 {hasError
        ? 'border-destructive/60 focus:border-destructive focus:ring-destructive/20'
        : ''}"
    bind:value
    {...rest}
/>
