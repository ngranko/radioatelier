<script lang="ts">
    import Spinner from '$lib/components/spinner.svelte';
    import ImageIcon from '@lucide/svelte/icons/image';

    interface Props {
        url: string | null;
        isBusy?: boolean;
    }

    let {url, isBusy = false}: Props = $props();
</script>

<div class="bg-muted relative grid size-13 shrink-0 place-items-center overflow-hidden rounded-lg">
    {#if url}
        <img src={url} alt="" class="size-full object-cover" />
    {:else}
        <ImageIcon class="text-muted-foreground size-5" />
    {/if}
    {#if isBusy}
        <div class="bg-background/60 absolute inset-0 grid place-items-center">
            <Spinner class="text-primary size-5" />
        </div>
    {/if}
</div>
