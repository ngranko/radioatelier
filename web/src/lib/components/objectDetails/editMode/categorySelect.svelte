<script lang="ts">
    import Combobox from '$lib/components/input/combobox.svelte';
    import {Skeleton} from '$lib/components/ui/skeleton';
    import {useConvexClient, useQuery} from 'convex-svelte';
    import {api} from '$convex/_generated/api';

    interface Props {
        name?: string | undefined;
        value: string | undefined;
        error?: string[] | null | undefined;
    }

    const client = useConvexClient();

    let {name = undefined, value = $bindable(), error = undefined}: Props = $props();

    const categories = useQuery(api.categories.list);
    const sortedCategories = $derived(
        categories.data ? [...categories.data].sort((a, b) => a.name.localeCompare(b.name)) : [],
    );

    // TODO: add an error state
    async function handleCreate(inputValue: string) {
        const result = await client.mutation(api.categories.create, {name: inputValue});
        return result;
    }
</script>

<!-- TODO: add an error state -->
{#if categories.isLoading}
    <Skeleton class="h-12 w-full rounded-md" />
{:else}
    <Combobox
        placeholder="Не выбрана"
        creatable={true}
        options={sortedCategories}
        {name}
        bind:value
        onCreate={handleCreate}
        error={Boolean(error)}
        class="px-3 py-1 transition-colors"
        wrapperClass="w-full"
    />
{/if}
