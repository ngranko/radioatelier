<script lang="ts">
    import {createMutation, createQuery} from '@tanstack/svelte-query';
    import {createCategory, listCategories} from '$lib/api/category';
    import Svelecte from 'svelecte';

    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let value: string | undefined;

    interface Item {
        value: string;
        label: string;
    }

    let items: Item[] = [];

    const createCategoryMutation = createMutation({
        mutationFn: createCategory,
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
