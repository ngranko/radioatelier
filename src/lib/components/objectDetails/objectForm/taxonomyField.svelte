<script lang="ts">
    import {api} from '$convex/_generated/api';
    import type {Id} from '$convex/_generated/dataModel';
    import CategoryBadge from '$lib/components/categoryBadge.svelte';
    import TaxonomySheet from '$lib/components/objectDetails/objectForm/taxonomySheet.svelte';
    import TagChip from '$lib/components/tagChip.svelte';
    import {Skeleton} from '$lib/components/ui/skeleton';
    import type {Option} from '$lib/interfaces/option';
    import {categoriesState} from '$lib/state/categories.svelte';
    import {cn} from '$lib/utils.js';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
    import {useConvexClient, useQuery} from 'convex-svelte';

    type Section = 'category' | 'tags' | 'privateTags';

    interface Props {
        category: string | undefined;
        tags: string[];
        privateTags: string[];
        error?: boolean;
        disabled?: boolean;
        [key: string]: unknown;
    }

    const client = useConvexClient();

    let {
        category = $bindable(),
        tags = $bindable([]),
        privateTags = $bindable([]),
        error = false,
        disabled = false,
        ...controlProps
    }: Props = $props();

    let isOpen = $state(false);

    const tagsQuery = useQuery(api.tags.list);
    const privateTagsQuery = useQuery(api.privateTags.list);

    const byName = (a: Option, b: Option) => a.name.localeCompare(b.name);
    const categories = $derived(
        Object.values(categoriesState.categories)
            .filter(item => !item.isHidden)
            .map(item => ({id: item.id, name: item.name}))
            .sort(byName),
    );
    const tagOptions = $derived([...(tagsQuery.data ?? [])].sort(byName));
    const privateTagOptions = $derived([...(privateTagsQuery.data ?? [])].sort(byName));

    const selectedCategory = $derived(categories.find(item => item.id === category));
    const selectedTags = $derived(tagOptions.filter(item => tags.includes(item.id)));
    const selectedPrivateTags = $derived(
        privateTagOptions.filter(item => privateTags.includes(item.id)),
    );
    const isEmpty = $derived(
        !selectedCategory && selectedTags.length === 0 && selectedPrivateTags.length === 0,
    );

    const isLoading = $derived(tagsQuery.isLoading || privateTagsQuery.isLoading);

    const creators: Record<Section, (name: string) => Promise<string>> = {
        category: name => client.mutation(api.categories.create, {name}),
        tags: name => client.mutation(api.tags.create, {name}),
        privateTags: name => client.mutation(api.privateTags.create, {name}),
    };
</script>

<button
    {...controlProps}
    type="button"
    {disabled}
    onclick={() => (isOpen = true)}
    class={cn(
        'border-input bg-background/50 dark:bg-background/30 flex min-h-12 w-full items-center gap-2 rounded-md border px-3 py-2 text-left',
        'focus:border-primary focus:ring-primary/30 focus:ring-4 dark:focus:ring-2',
        error && 'border-destructive',
    )}
>
    <span class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {#if selectedCategory}
            <CategoryBadge
                name={selectedCategory.name}
                categoryId={selectedCategory.id as Id<'categories'>}
                size="sm"
            />
        {/if}
        {#each selectedTags as tag (tag.id)}
            <TagChip name={tag.name} />
        {/each}
        {#each selectedPrivateTags as tag (tag.id)}
            <TagChip name={tag.name} isPrivate />
        {/each}
        {#if isLoading}
            <Skeleton class="h-5 w-32 rounded-full" />
        {:else if isEmpty}
            <span class="text-muted-foreground/40 text-base">Не выбраны</span>
        {/if}
    </span>
    <ChevronDownIcon class="size-4 shrink-0 opacity-50" />
</button>

<input type="hidden" name="category" value={category ?? ''} />
{#each tags as tag (tag)}
    <input type="hidden" name="tags" value={tag} />
{/each}
{#each privateTags as tag (tag)}
    <input type="hidden" name="privateTags" value={tag} />
{/each}

{#if isOpen}
    <TaxonomySheet
        {categories}
        {tagOptions}
        {privateTagOptions}
        bind:category
        bind:tags
        bind:privateTags
        onCreate={(section, name) => creators[section](name)}
        onClose={() => (isOpen = false)}
    />
{/if}
