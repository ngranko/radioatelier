<script lang="ts">
    import {Popover as PopoverPrimitive} from 'bits-ui';
    import type {Snippet} from 'svelte';
    import {cn, type WithoutChild} from '$lib/utils.js';

    let {
        open = $bindable(false),
        children,
        ...restProps
    }: WithoutChild<PopoverPrimitive.RootProps> & {
        children: Snippet;
    } = $props();
</script>

<PopoverPrimitive.Root bind:open {...restProps}>
    {@render children?.()}
</PopoverPrimitive.Root>
