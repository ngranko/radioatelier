<script lang="ts">
    import {createMutation} from '@tanstack/svelte-query';
    import {createTag} from '$lib/api/tag';
    import {invalidateReferenceData} from '$lib/cache/referenceData';
    import Combobox from '$lib/components/input/combobox.svelte';
    import type {Tag} from '$lib/interfaces/tag';
    import {page} from '$app/state';

    interface Props {
        name?: string;
        value?: string[];
        error: any[] | null;
    }

    let {name = undefined, value = $bindable([]), error = null}: Props = $props();

    const createTagMutation = createMutation({
        mutationFn: createTag,
        onSuccess: () => {
            invalidateReferenceData();
        },
    });

    const sortedTags = $derived(
        page.data.tags ? [...page.data.tags].sort((a, b) => a.name.localeCompare(b.name)) : [],
    );

    async function handleCreate(inputValue: string): Promise<Tag> {
        const result = await $createTagMutation.mutateAsync({name: inputValue});
        return {id: result.data.id, name: result.data.name};
    }
</script>

<Combobox
    placeholder="Не выбраны"
    creatable={true}
    multiple={true}
    options={sortedTags}
    {name}
    bind:value
    onCreate={handleCreate}
    error={Boolean(error)}
    class="px-3 py-1 transition-colors"
    wrapperClass="w-full"
/>
