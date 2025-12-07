<script lang="ts">
    import {createMutation} from '@tanstack/svelte-query';
    import {createCategory} from '$lib/api/category';
    import {invalidateReferenceData} from '$lib/cache/referenceData';
    import Combobox from '$lib/components/input/combobox.svelte';
    import type {Category} from '$lib/interfaces/category.js';
    import {page} from '$app/state';

    interface Props {
        name?: string | undefined;
        value: string | undefined;
        error?: string[] | null | undefined;
    }

    let {name = undefined, value = $bindable(), error = undefined}: Props = $props();

    const createCategoryMutation = createMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            invalidateReferenceData();
        },
    });

    const sortedCategories = $derived(
        page.data.categories
            ? [...page.data.categories].sort((a, b) => a.name.localeCompare(b.name))
            : [],
    );

    async function handleCreate(inputValue: string): Promise<Category> {
        const result = await $createCategoryMutation.mutateAsync({name: inputValue});
        return {id: result.data.id, name: result.data.name};
    }
</script>

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
