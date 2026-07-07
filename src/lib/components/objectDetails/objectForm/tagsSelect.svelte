<script lang="ts">
    import Combobox from '$lib/components/input/combobox.svelte';
    import {useConvexClient} from 'convex-svelte';
    import {api} from '$convex/_generated/api';
    import {tagsState} from '$lib/state/tags.svelte';

    interface Props {
        name?: string;
        value?: string[];
        error: string[] | null;
    }

    const client = useConvexClient();

    let {name = undefined, value = $bindable([]), error = null}: Props = $props();

    // TODO: add an error state
    async function handleCreate(inputValue: string) {
        const result = await client.mutation(api.tags.create, {name: inputValue});
        return result;
    }
</script>

<Combobox
    placeholder="Не выбраны"
    creatable={true}
    multiple={true}
    options={tagsState.tags.map(tag => ({id: tag.id, name: tag.name}))}
    {name}
    bind:value
    onCreate={handleCreate}
    error={Boolean(error)}
    class="px-3 py-1 transition-colors"
    wrapperClass="w-full"
/>
