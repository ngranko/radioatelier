<script lang="ts">
    import Badge from '$lib/components/ui/badge/badge.svelte';
    import type {FuzzyTag} from '$lib/interfaces/tag.js';
    import type {FuzzyPrivateTag} from '$lib/interfaces/privateTag.ts';

    interface Props {
        tags: FuzzyTag[];
        privateTags: FuzzyPrivateTag[];
    }

    let {tags, privateTags}: Props = $props();

    const sortedTags = $derived([...tags].sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0)));
    const sortedPrivateTags = $derived([...privateTags].sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0)));
</script>

<div class="flex flex-wrap gap-2">
    {#each sortedTags as tag}
        <Badge variant="secondary" class="bg-sky-100 text-sky-800">
            <i class="fa-solid fa-tag"></i>
            <span class="lowercase">{tag.name}</span>
        </Badge>
    {/each}
    {#each sortedPrivateTags as tag}
        <Badge variant="secondary" class="bg-amber-100 text-amber-900">
            <i class="fa-solid fa-lock"></i>
            <span class="lowercase">{tag.name}</span>
        </Badge>
    {/each}
</div>
