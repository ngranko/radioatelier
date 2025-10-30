<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";

	let {
		class: className,
		children,
		...restProps
	}: {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div
	class={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className)}
	{...restProps}
>
	{@render children?.()}
</div>

