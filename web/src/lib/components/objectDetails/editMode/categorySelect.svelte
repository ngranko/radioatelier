<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {createCategory, listCategories} from '$lib/api/category';
    import {Combobox} from '$lib/components/ui/combobox';
    import type {Payload} from '$lib/interfaces/api';
    import type {Category, ListCategoriesResponsePayload} from '$lib/interfaces/category.js';
    import {cn} from '$lib/utils.ts';

    const client = useQueryClient();

    interface Props {
        id?: string | undefined;
        name?: string | undefined;
        value: string | undefined;
        error?: string[] | null | undefined;
        onChange(value: Category): void;
    }

    let {id = undefined, name = undefined, value, error = undefined, onChange}: Props = $props();

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

    function getCreateRowLabel(value: string) {
        return `Создать '${value}'`;
    }

    function handleChange(category: Category | null) {
        if (category) {
            onChange(category);
        }
    }
</script>

<!-- TODO: add loading state -->
{#if !$categories.isLoading}
    <Combobox
        onChange={handleChange}
        {id}
        placeholder="Не выбрана"
        creatable={true}
        createLabel={getCreateRowLabel}
        options={sortedCategories}
        {name}
        {value}
        onCreate={handleCreate}
        error={!!error}
        class={cn({'transition-colors': true})}
    />
{/if}
