<script lang="ts">
    import Badge from '$lib/components/ui/badge/badge.svelte';
    import type {Tag} from '$lib/interfaces/tag.js';
    import type {PrivateTag} from '$lib/interfaces/privateTag.ts';

    interface Props {
        tags: Tag[];
        privateTags: PrivateTag[];
    }

    let {tags, privateTags}: Props = $props();

    const sortedTags = $derived(
        [...tags].sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0)),
    );
    const sortedPrivateTags = $derived(
        [...privateTags].sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0)),
    );
</script>

<div class="flex flex-wrap gap-2">
    {#each sortedTags as tag (tag.id)}
        <Badge variant="secondary" class="text-primary border-primary/15 bg-primary/10">
            <i class="fa-solid fa-tag"></i>
            <span class="lowercase">{tag.name}</span>
        </Badge>
    {/each}
    {#each sortedPrivateTags as tag (tag.id)}
        <Badge variant="secondary" class="border-border bg-muted text-muted-foreground">
            <i class="fa-solid fa-lock"></i>
            <span class="lowercase">{tag.name}</span>
        </Badge>
    {/each}
</div>
