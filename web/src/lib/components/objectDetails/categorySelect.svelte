<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {createCategory, listCategories} from '$lib/api/category';
    import Svelecte from 'svelecte';
    import type {Payload} from '$lib/interfaces/api';
    import type {ListCategoriesResponsePayload} from '$lib/interfaces/category.js';

    interface Item {
        value: string;
        label: string;
    }

    const client = useQueryClient();

    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let value: string | undefined;

    let items: Item[] = [];

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

    $: if ($categories.isSuccess) {
        items = $categories.data.data.categories.map(
            (item): Item => ({value: item.id, label: item.name}),
        );
    }

    async function handleCreate(props: {
        inputValue: string;
        valueField: string;
        labelField: string;
        prefix: string;
    }) {
        const result = await $createCategoryMutation.mutateAsync({name: props.inputValue});
        return {value: result.data.id, label: result.data.name};
    }
</script>

<!-- TODO: add loading state -->
{#if !$categories.isLoading}
    <Svelecte
        inputId={id}
        placeholder="Не выбрана"
        highlightFirstItem={false}
        creatable={true}
        i18n={{
            createRowLabel: value => `Создать '${value}'`,
        }}
        options={items.sort((a, b) => a.label.localeCompare(b.label))}
        {name}
        bind:value
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
        height: 38px;
        border-color: colors.$lightgray;
    }
</style>
