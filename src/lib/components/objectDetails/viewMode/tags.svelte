<script lang="ts">
    import TagChip from '$lib/components/tagChip.svelte';
    import type {PrivateTag} from '$lib/interfaces/privateTag.ts';
    import type {Tag} from '$lib/interfaces/tag.js';

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
        <TagChip name={tag.name} />
    {/each}
    {#each sortedPrivateTags as tag (tag.id)}
        <TagChip name={tag.name} isPrivate />
    {/each}
</div>
