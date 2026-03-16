<script lang="ts">
    import Combobox from '$lib/components/input/combobox.svelte';
    import {Skeleton} from '$lib/components/ui/skeleton';
    import {useConvexClient, useQuery} from 'convex-svelte';
    import {api} from '$convex/_generated/api';

    interface Props {
        name?: string;
        value?: string[];
        error: string[] | null;
    }

    const client = useConvexClient();

    let {name = undefined, value = $bindable([]), error = null}: Props = $props();

    const privateTags = useQuery(api.privateTags.list);

    const sortedPrivateTags = $derived(
        privateTags.data ? [...privateTags.data].sort((a, b) => a.name.localeCompare(b.name)) : [],
    );

    // TODO: add an error state
    async function handleCreate(inputValue: string) {
        const result = await client.mutation(api.privateTags.create, {name: inputValue});
        return result;
    }
</script>

<!-- TODO: add an error state -->
{#if privateTags.isLoading}
    <Skeleton class="h-12 w-full rounded-md" />
{:else}
    <Combobox
        placeholder="Не выбраны"
        creatable={true}
        multiple={true}
        options={sortedPrivateTags}
        {name}
        bind:value
        onCreate={handleCreate}
        error={Boolean(error)}
        class="px-3 py-1 transition-colors"
        wrapperClass="w-full"
    />
{/if}
