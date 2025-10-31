<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {createCategory, listCategories} from '$lib/api/category';
    import Combobox from '$lib/components/input/combobox.svelte';
    import type {Payload} from '$lib/interfaces/api';
    import type {Category, ListCategoriesResponsePayload} from '$lib/interfaces/category.js';

    const client = useQueryClient();

    interface Props {
        name?: string | undefined;
        value: string | undefined;
        error?: string[] | null | undefined;
        onChange(value: string): void;
    }

    let {name = undefined, value, error = undefined, onChange}: Props = $props();

    const createCategoryMutation = createMutation({
        mutationFn: createCategory,
        onSuccess: ({data}) => {
            const cachedValue: Payload<ListCategoriesResponsePayload> | undefined =
                client.getQueryData(['categories']);
            if (cachedValue) {
                client.setQueryData(['categories'], {
                    data: {categories: [...cachedValue.data.categories, data]},
                });
            }
        },
    });

    const categories = createQuery({queryKey: ['categories'], queryFn: listCategories});

    const sortedCategories = $derived(
        $categories.data?.data.categories
            ? [...$categories.data.data.categories].sort((a, b) => a.name.localeCompare(b.name))
            : [],
    );

    async function handleCreate(inputValue: string): Promise<Category> {
        const result = await $createCategoryMutation.mutateAsync({name: inputValue});
        return {id: result.data.id, name: result.data.name};
    }

    function handleChange(category: string | null) {
        onChange(category ?? '');
    }
</script>

<!-- TODO: add loading state -->
{#if !$categories.isLoading}
    <Combobox
        onChange={handleChange}
        placeholder="Не выбрана"
        creatable={true}
        options={sortedCategories}
        {name}
        {value}
        onCreate={handleCreate}
        error={!!error}
        class="w-full transition-colors"
        wrapperClass="w-full"
    />
{/if}
