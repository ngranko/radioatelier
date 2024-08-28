<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {createCategory, listCategories} from '$lib/api/category';
    import Svelecte from 'svelecte';
    import type {Payload} from '$lib/interfaces/api';
    import type {Category, ListCategoriesResponsePayload} from '$lib/interfaces/category.js';

    const client = useQueryClient();

    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let value: Category | undefined;

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
</script>

<!-- TODO: add loading state -->
{#if !$categories.isLoading}
    <Svelecte
        inputId={id}
        placeholder="Не выбрана"
        highlightFirstItem={false}
        creatable={true}
        valueField="id"
        labelField="name"
        i18n={{
            createRowLabel: value => `Создать '${value}'`,
        }}
        options={$categories.data?.data.categories.sort((a, b) => a.name.localeCompare(b.name))}
        {name}
        bind:value
        valueAsObject={true}
        createHandler={handleCreate}
    />
{/if}

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    :global(.creatable-row) {
        @include typography.brand-face;
    }

    :global(.svelecte .sv-control) {
        --sv-min-height: 38px;
        border-color: colors.$gray;
    }
</style>
