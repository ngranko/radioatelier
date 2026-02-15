<script lang="ts">
    import type {HTMLInputAttributes, HTMLInputTypeAttribute} from 'svelte/elements';
    import {cn, type WithElementRef} from '$lib/utils.js';

    type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

    type Props = WithElementRef<
        Omit<HTMLInputAttributes, 'type'> &
            ({type: 'file'; files?: FileList} | {type?: InputType; files?: undefined})
    >;

    let {
        ref = $bindable(null),
        value = $bindable(),
        type,
        files = $bindable(),
        class: className,
        ...restProps
    }: Props = $props();
</script>

{#if type === 'file'}
    <input
        bind:this={ref}
        data-slot="input"
        class={cn(
            'bg-background/50 dark:bg-background/30 selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground/40 flex h-12 w-full min-w-0 rounded-xl border px-4 pt-1.5 font-medium text-base ring-0 outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
            'focus:border-primary focus:ring-primary/20 focus:ring-4 dark:focus:ring-2',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            className,
        )}
        type="file"
        bind:files
        bind:value
        {...restProps}
    />
{:else}
    <input
        bind:this={ref}
        data-slot="input"
        class={cn(
            'bg-background/50 dark:bg-background/30 selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground/40 flex h-12 w-full min-w-0 rounded-xl border px-4 text-base ring-0 outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
            'focus:border-primary focus:ring-primary/20 focus:ring-4 dark:focus:ring-2',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            className,
        )}
        {type}
        bind:value
        {...restProps}
    />
{/if}
