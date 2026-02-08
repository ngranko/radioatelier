<script lang="ts">
    import Button from '$lib/components/ui/button/button.svelte';
    import type {Snippet} from 'svelte';
    import LoadingDots from './loadingDots.svelte';

    interface Props {
        disabled?: boolean;
        ariaLabel: string;
        loading?: boolean;
        children: Snippet;
        onclick: () => void;
    }

    let {disabled, ariaLabel, loading, children, onclick}: Props = $props();
</script>

<Button variant="outline" class="w-full" {disabled} {onclick} aria-label={ariaLabel}>
    {#if loading}
        <LoadingDots />
    {:else}
        {@render children?.()}
    {/if}
</Button>
