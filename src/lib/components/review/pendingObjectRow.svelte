<script lang="ts">
    import type {Id} from '$convex/_generated/dataModel';
    import CategoryBadge from '$lib/components/categoryBadge.svelte';
    import TagChip from '$lib/components/tagChip.svelte';
    import {Button} from '$lib/components/ui/button';
    import {approveObject} from '$lib/services/objectReview';
    import {selectObject} from '$lib/services/objectSelection';
    import CheckIcon from '@lucide/svelte/icons/check';
    import {useConvexClient} from 'convex-svelte';
    import ReviewThumbnail from './reviewThumbnail.svelte';

    interface Props {
        object: {
            id: Id<'objects'>;
            name: string;
            category: {id: Id<'categories'>; name: string};
            tags: {id: Id<'tags'>; name: string}[];
            imageUrl: string | null;
            latitude: number;
            longitude: number;
        };
    }

    let {object}: Props = $props();

    const client = useConvexClient();
    let isApproving = $state(false);

    async function handleApproveClick() {
        isApproving = true;
        await approveObject(client, object.id, 'review_list');
        isApproving = false;
    }
</script>

<div class="hover:bg-accent/50 flex items-center gap-2 rounded-lg pr-1">
    <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-3 py-2 pl-3 text-left"
        onclick={() => selectObject(object.id, object)}
    >
        <ReviewThumbnail url={object.imageUrl} />
        <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{object.name}</p>
            <div class="mt-1 flex flex-wrap items-center gap-1.5">
                <CategoryBadge
                    name={object.category.name}
                    categoryId={object.category.id}
                    size="sm"
                />
                {#each object.tags as tag (tag.id)}
                    <TagChip name={tag.name} />
                {/each}
            </div>
        </div>
    </button>
    <Button
        variant="outline"
        size="icon"
        class="text-primary hover:text-primary size-9 rounded-full"
        loading={isApproving}
        onclick={handleApproveClick}
        aria-label="Подтвердить «{object.name}»"
        title="Подтвердить"
    >
        <CheckIcon />
    </Button>
</div>
