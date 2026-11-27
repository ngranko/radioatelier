<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
    import XIcon from '@lucide/svelte/icons/x';
    import type {Snippet} from 'svelte';
    import DiscardPhotoDialog from './discardPhotoDialog.svelte';
    import ReviewThumbnail from './reviewThumbnail.svelte';

    interface Props {
        title: string;
        hint: string | null;
        imageUrl: string | null;
        actions: Snippet;
        onDiscard(): void;
    }

    let {title, hint, imageUrl, actions, onDiscard}: Props = $props();

    let isDiscardConfirmOpen = $state(false);
</script>

<div class="flex items-start gap-3 rounded-lg py-2 pr-1 pl-3">
    <ReviewThumbnail url={imageUrl} />
    <div class="min-w-0 flex-1 pt-0.5">
        <p class="text-destructive flex items-center gap-1.5 text-sm font-medium">
            <CircleAlertIcon class="size-4 shrink-0" />
            {title}
        </p>
        {#if hint}
            <p class="text-muted-foreground mt-0.5 text-xs">{hint}</p>
        {/if}
        <div class="mt-2 flex flex-wrap gap-2">
            {@render actions()}
        </div>
    </div>
    <Button
        variant="ghost"
        size="icon"
        class="text-muted-foreground size-8"
        onclick={() => (isDiscardConfirmOpen = true)}
        aria-label="Удалить фото"
        title="Удалить фото"
    >
        <XIcon />
    </Button>
</div>
<DiscardPhotoDialog bind:open={isDiscardConfirmOpen} onConfirm={onDiscard} />
