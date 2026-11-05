<script lang="ts">
    import {cn, type WithElementRef, type WithoutChildren} from '$lib/utils.js';
    import type {HTMLTextareaAttributes} from 'svelte/elements';

    let {
        ref = $bindable(null),
        value = $bindable(),
        class: className,
        ...restProps
    }: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
    bind:this={ref}
    data-slot="textarea"
    class={cn(
        'border-input bg-background/50 dark:bg-background/30 placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-xl border px-4 py-3 text-base font-medium ring-0 transition-all duration-200 outline-none placeholder:font-normal disabled:cursor-not-allowed disabled:opacity-50',
        'focus:border-primary focus:ring-primary/20 focus:ring-4 dark:focus:ring-2',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
    )}
    bind:value
    {...restProps}></textarea>
