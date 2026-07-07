<script lang="ts">
    import Combobox from '$lib/components/input/combobox.svelte';
    import {useConvexClient} from 'convex-svelte';
    import {api} from '$convex/_generated/api';
    import {privateTagsState} from '$lib/state/privateTags.svelte';

    interface Props {
        name?: string;
        value?: string[];
        error: string[] | null;
    }

    const client = useConvexClient();

    let {name = undefined, value = $bindable([]), error = null}: Props = $props();

    // TODO: add an error state
    async function handleCreate(inputValue: string) {
        const result = await client.mutation(api.privateTags.create, {name: inputValue});
        return result;
    }
</script>

<Combobox
    placeholder="Не выбраны"
    creatable={true}
    multiple={true}
    options={privateTagsState.privateTags.map(tag => ({id: tag.id, name: tag.name}))}
    {name}
    bind:value
    onCreate={handleCreate}
    error={Boolean(error)}
    class="px-3 py-1 transition-colors"
    wrapperClass="w-full"
/>
