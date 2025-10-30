<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		selected = false,
		class: className,
		onClick,
		...restProps
	}: {
		selected?: boolean;
		class?: string;
		onClick?: () => void;
	} = $props();
</script>

<div
	class={cn(
		"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
		selected && "bg-accent text-accent-foreground",
		className
	)}
	onclick={onClick}
	role="option"
	{...restProps}
>
	{@render children?.()}
</div>

