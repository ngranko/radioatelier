<script lang="ts">
    import type {WithoutChild} from '$lib/utils.js';
    import {Popover as PopoverPrimitive} from 'bits-ui';
    import type {Snippet} from 'svelte';

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
