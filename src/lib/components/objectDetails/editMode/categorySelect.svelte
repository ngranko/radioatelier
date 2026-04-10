<script lang="ts">
    import Combobox from '$lib/components/input/combobox.svelte';
    import {useConvexClient} from 'convex-svelte';
    import {api} from '$convex/_generated/api';
    import {categoriesState} from '$lib/state/categories.svelte';

    interface Props {
        name?: string | undefined;
        value: string | undefined;
        error: string[] | null;
    }

    const client = useConvexClient();

    let {name = undefined, value = $bindable(), error = null}: Props = $props();

    const preparedCategories = $derived(
        categoriesState.list
            .filter(item => !item.isHidden)
            .map(item => ({id: item.id, name: item.name}))
            .sort((a, b) => a.name.localeCompare(b.name)),
    );

    // TODO: add an error state
    async function handleCreate(inputValue: string) {
        const result = await client.mutation(api.categories.create, {name: inputValue});
        return result;
    }
</script>

<Combobox
    placeholder="Не выбрана"
    creatable={true}
    options={preparedCategories}
    {name}
    bind:value
    onCreate={handleCreate}
    error={Boolean(error)}
    class="px-3 py-1 transition-colors"
    wrapperClass="w-full"
/>
