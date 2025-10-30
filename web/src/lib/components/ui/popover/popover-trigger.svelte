<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";
	import { cn, type WithoutChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChild<PopoverPrimitive.TriggerProps> & {
		children: Snippet;
	} = $props();
</script>

<PopoverPrimitive.Trigger
	bind:ref
	class={cn("outline-none", className)}
	{...restProps}
>
	{@render children?.()}
</PopoverPrimitive.Trigger>

