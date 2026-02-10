<script lang="ts">
    import type {HTMLInputAttributes} from 'svelte/elements';

    interface Props extends Omit<HTMLInputAttributes, 'class' | 'type'> {
        hasError?: boolean;
    }

    let {hasError = false, value = $bindable(), ...rest}: Props = $props();
    let isPlainPassword = $state(false);
</script>

<div class="relative">
    <input
        type={isPlainPassword ? 'text' : 'password'}
        class="bg-background/50 ring-ring/20 placeholder:text-muted-foreground/40 focus:border-primary focus:ring-primary/20 dark:bg-background/30 h-12 w-full rounded-xl border px-4 pr-12 text-base outline-none ring-0 transition-all duration-200 focus:ring-4 dark:focus:ring-2 {hasError
            ? 'border-destructive/60 focus:border-destructive focus:ring-destructive/20'
            : ''}"
        bind:value
        {...rest}
    />
    <button
        type="button"
        class="text-muted-foreground/60 hover:text-foreground/80 absolute top-1/2 right-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors"
        onclick={e => {
            e.stopPropagation();
            isPlainPassword = !isPlainPassword;
        }}
        tabindex={-1}
    >
        {#if isPlainPassword}
            <i class="fa-regular fa-eye-slash text-lg"></i>
        {:else}
            <i class="fa-regular fa-eye text-lg"></i>
        {/if}
    </button>
</div>
