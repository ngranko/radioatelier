<script lang="ts">
    import type {Component, Snippet} from 'svelte';

    interface Props {
        icon: Component<{class?: string}>;
        iconClass: string;
        message: string;
        children?: Snippet;
    }

    let {icon: Icon, iconClass, message, children}: Props = $props();
</script>

<div class="flex flex-col items-center gap-2 px-4 py-6 text-center" role="status">
    <Icon class="size-5 {iconClass}" />
    <span class="text-muted-foreground text-sm">{message}</span>
    {#if children}
        <div class="mt-1 flex flex-wrap justify-center gap-2">
            {@render children()}
        </div>
    {/if}
</div>
