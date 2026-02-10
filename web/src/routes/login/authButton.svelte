<script lang="ts">
    import type {Snippet} from 'svelte';
    import type {HTMLButtonAttributes} from 'svelte/elements';

    interface Props extends HTMLButtonAttributes {
        loading?: boolean;
        variant?: 'primary' | 'secondary' | 'ghost';
        href?: string;
        children: Snippet;
    }

    let {loading = false, variant = 'primary', href, children, ...rest}: Props = $props();

    const baseClasses =
        'group relative h-12 w-full rounded-xl font-medium text-base transition-all flex items-center justify-center gap-2 overflow-hidden';

    const variantClasses = {
        primary:
            'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100',
        secondary:
            'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98] ring-1 ring-border/50',
        ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-[0.98]',
    };
</script>

{#if href}
    <a class="{baseClasses} {variantClasses[variant]}" {href}>
        <span class="relative z-10 flex items-center justify-center gap-2">
            {@render children()}
        </span>
    </a>
{:else}
    <button class="{baseClasses} {variantClasses[variant]}" disabled={loading} {...rest}>
        <span class="relative z-10 flex items-center justify-center gap-2">
            {@render children()}
        </span>
    </button>
{/if}
