<script lang="ts">
    import {createMutation, createQuery} from '@tanstack/svelte-query';
    import Select from 'svelte-select';
    import {createCategory, listCategories} from '$lib/api/category';
    import {beforeUpdate} from 'svelte';

    export let name: string;
    export let value: string | undefined;

    interface Item {
        value: string;
        label: string;
        created?: boolean;
    }

    let filterText = '';
    let items: Item[] = [];
    let justValue: string | undefined;

    beforeUpdate(() => {
        if (!justValue && value) {
            justValue = value;
        }
    });

    const createCategoryMutation = createMutation({
        mutationFn: createCategory,
    });

    const categories = createQuery({queryKey: ['categories'], queryFn: listCategories});

    $: if ($categories.isSuccess) {
        items = $categories.data.data.categories.map(
            (item): Item => ({value: item.id, label: item.name, created: false}),
        );
    }

    function handleFilter(e: CustomEvent<Item[]>) {
        if (e.detail.length === 0 && filterText.length > 0) {
            const prev = items.filter(i => !i.created);
            items = [...prev, {value: filterText, label: filterText, created: true}];
        }
    }

    async function handleChange(e: CustomEvent<Item>) {
        if (e.detail.created) {
            const result = await $createCategoryMutation.mutateAsync({name: e.detail.label});
            items = items.map(i => {
                if (i.value === e.detail.value) {
                    i.value = result.data.id;
                    delete i.created;
                }
                return i;
            });
        }
    }

    function handleBlur() {
        items = items.filter(i => !i.created);
    }
</script>

<Select
    value={justValue}
    placeholder="Выберите категорию"
    on:change={handleChange}
    on:filter={handleFilter}
    on:blur={handleBlur}
    bind:filterText
    {items}
>
    <div slot="item" let:item>
        {item.created ? 'Создать: ' : ''}
        {item.label}
    </div>
</Select>
<input type="hidden" {name} value={justValue} />
