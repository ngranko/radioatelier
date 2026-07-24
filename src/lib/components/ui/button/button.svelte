<script lang="ts" module>
    import {cn, type WithElementRef} from '$lib/utils.js';
    import type {HTMLAnchorAttributes, HTMLButtonAttributes} from 'svelte/elements';
    import {type VariantProps, tv} from 'tailwind-variants';

    export const buttonVariants = tv({
        base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium text-base outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
                destructive:
                    'bg-destructive shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white',
                outline:
                    'bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border',
                secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-9 px-4 py-2 has-[>svg]:px-3',
                sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
                lg: 'h-12 px-4 py-2 has-[>svg]:px-3 active:scale-[0.98] disabled:active:scale-100',
                icon: 'size-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    });

    export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
    export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

    export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
        WithElementRef<HTMLAnchorAttributes> & {
            variant?: ButtonVariant;
            size?: ButtonSize;
            loading?: boolean;
        };
</script>

<script lang="ts">
    import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

    let {
        class: className,
        variant = 'default',
        size = 'default',
        ref = $bindable(null),
        href = undefined,
        type = 'button',
        disabled,
        loading = false,
        children,
        ...restProps
    }: ButtonProps = $props();

    let isDisabled = $derived(disabled || loading);
    let classes = $derived(
        cn(
            buttonVariants({variant, size}),
            // a busy button is not an unavailable one, so it keeps its full contrast
            loading && 'relative disabled:opacity-100 aria-disabled:opacity-100',
            className,
        ),
    );
</script>

{#snippet content()}
    {#if loading}
        <span class="absolute inset-0 flex items-center justify-center">
            <LoaderCircleIcon class="size-4 animate-spin" />
        </span>
        <!-- the label keeps its space while hidden, so the spinner cannot resize the button -->
        <span class="invisible contents">{@render children?.()}</span>
    {:else}
        {@render children?.()}
    {/if}
{/snippet}

{#if href}
    <a
        bind:this={ref}
        data-slot="button"
        class={classes}
        href={isDisabled ? undefined : href}
        aria-disabled={isDisabled}
        aria-busy={loading}
        role={isDisabled ? 'link' : undefined}
        tabindex={isDisabled ? -1 : undefined}
        {...restProps}
    >
        {@render content()}
    </a>
{:else}
    <button
        bind:this={ref}
        data-slot="button"
        class={classes}
        {type}
        disabled={isDisabled}
        aria-busy={loading}
        {...restProps}
    >
        {@render content()}
    </button>
{/if}
