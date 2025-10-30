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
	class={cn("py-6 text-center text-sm text-muted-foreground", className)}
	{...restProps}
>
	{@render children?.()}
</div>

