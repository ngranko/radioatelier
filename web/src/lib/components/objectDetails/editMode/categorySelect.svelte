<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {createCategory, listCategories} from '$lib/api/category';
    import Svelecte from 'svelecte';
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

    async function handleCreate(props: {
        inputValue: string;
        valueField: string;
        labelField: string;
        prefix: string;
    }) {
        const result = await $createCategoryMutation.mutateAsync({name: props.inputValue});
        return {id: result.data.id, name: result.data.name};
    }

    function getCreateRowLabel(value: string) {
        return `Создать '${value}'`;
    }
</script>

<!-- TODO: add loading state -->
{#if !$categories.isLoading}
    <Svelecte
        {onChange}
        inputId={id}
        placeholder="Не выбрана"
        highlightFirstItem={false}
        creatable={true}
        i18n={{
            createRowLabel: getCreateRowLabel,
        }}
        options={$categories.data?.data.categories.sort((a, b) => a.name.localeCompare(b.name))}
        {name}
        {value}
        createHandler={handleCreate}
        controlClass={cn({'transition-colors': true, 'sv-control-error': error})}
    />
{/if}
