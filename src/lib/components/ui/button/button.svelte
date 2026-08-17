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
            // a button with a loading state keeps its icon one level deeper, inside the label
            // face, so the icon padding has to be matched on both shapes
            size: {
                default: 'h-9 px-4 py-2 has-[>svg]:px-3 has-[[data-slot=button-label]>svg]:px-3',
                sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5 has-[[data-slot=button-label]>svg]:px-2.5',
                lg: 'h-12 px-4 py-2 has-[>svg]:px-3 has-[[data-slot=button-label]>svg]:px-3 active:scale-[0.98] disabled:active:scale-100',
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
    import Spinner from '$lib/components/spinner.svelte';

    let {
        class: className,
        variant = 'default',
        size = 'default',
        ref = $bindable(null),
        href = undefined,
        type = 'button',
        disabled,
        loading = undefined,
        children,
        ...restProps
    }: ButtonProps = $props();

    // both faces have to be mounted before the swap for the slide to run, and that wrapper would
    // break the layout of buttons built around their children — so only opt-in buttons get it
    let hasLoadingState = $derived(loading !== undefined);
    let isDisabled = $derived(disabled || loading);
    let classes = $derived(
        cn(
            buttonVariants({variant, size}),
            // busy ≠ unavailable, so keep full contrast while the spinner is up
            loading && 'disabled:opacity-100 aria-disabled:opacity-100',
            className,
        ),
    );
</script>

{#snippet content()}
    {#if hasLoadingState}
        <span
            data-slot="button-faces"
            data-state={loading ? 'busy' : 'idle'}
            class="grid overflow-hidden"
        >
            <!-- the label stays mounted while busy: it holds the button's width and its
                 accessible name, and it has to be there to slide back in -->
            <span
                data-slot="button-label"
                class="col-start-1 row-start-1 flex items-center justify-center gap-2"
            >
                {@render children?.()}
            </span>
            <span
                data-slot="button-spinner"
                class="col-start-1 row-start-1 flex items-center justify-center"
                aria-hidden="true"
            >
                <Spinner class={cn('size-4', !loading && 'animate-none')} />
            </span>
        </span>
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

<style>
    [data-slot='button-faces'] {
        --lift: cubic-bezier(0.55, 0, 0.95, 0.4);
        --land: cubic-bezier(0.16, 1.1, 0.3, 1);
        /* the leaving face clears the slot before the arriving one starts moving */
        --gap: 55ms;
    }

    /* whichever face is leaving lifts and accelerates away */
    [data-slot='button-spinner'],
    [data-state='busy'] > [data-slot='button-label'] {
        transition:
            transform 200ms var(--lift),
            opacity 120ms cubic-bezier(0.4, 0, 1, 1);
    }

    /* whichever face is arriving drops in and settles once */
    [data-slot='button-label'],
    [data-state='busy'] > [data-slot='button-spinner'] {
        transition:
            transform 200ms var(--land) var(--gap),
            opacity 170ms linear var(--gap);
    }

    [data-slot='button-spinner'] {
        transform: translateY(115%);
        opacity: 0;
    }

    [data-state='busy'] > [data-slot='button-label'] {
        transform: translateY(-115%);
        opacity: 0;
    }

    [data-state='busy'] > [data-slot='button-spinner'] {
        transform: translateY(0);
        opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
        /* the state still changes, only the travel is dropped; !important because the
           direction-aware rules above are more specific */
        [data-slot='button-label'],
        [data-slot='button-spinner'] {
            transition-duration: 1ms !important;
            transition-delay: 0ms !important;
        }
    }
</style>
