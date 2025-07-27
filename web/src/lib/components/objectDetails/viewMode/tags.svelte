<script lang="ts">
    import type {FuzzyTag} from '$lib/interfaces/tag.js';
    import type {FuzzyPrivateTag} from '$lib/interfaces/privateTag.ts';

    interface Props {
        tags: FuzzyTag[];
        privateTags: FuzzyPrivateTag[];
    }

    let {tags, privateTags}: Props = $props();
</script>

<div class="mb-4 flex flex-wrap gap-1">
    {#each tags.sort((a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0)) ?? [] as tag}
        <span
            class="rounded-sm border border-blue-200 bg-blue-50 px-2.5 pt-0.5 pb-1 text-xs font-medium lowercase"
        >
            {tag.name}
        </span>
    {/each}
    {#each privateTags.sort( (a, b) => (a.name && b.name ? a.name.localeCompare(b.name) : 0), ) ?? [] as tag}
        <span
            class="rounded-sm border border-amber-200 bg-amber-50 px-2.5 pt-0.5 pb-1 text-xs font-medium lowercase"
        >
            {tag.name}
        </span>
    {/each}
</div>
