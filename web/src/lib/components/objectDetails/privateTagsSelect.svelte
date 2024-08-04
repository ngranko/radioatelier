<script lang="ts">
    import {createMutation, createQuery} from '@tanstack/svelte-query';
    import Svelecte from 'svelecte';
    import {createPrivateTag, listPrivateTags} from '$lib/api/privateTag';

    interface Item {
        value: string;
        label: string;
    }

    interface ValueItem {
        value: string;
    }

    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let initialValue: string[] | undefined = [];
    export let selection: string[] = [];

    let prevInitialValue: string[] = initialValue ?? [];
    let value: ValueItem[] = initialValue?.map(item => ({value: item})) ?? [];
    let items: Item[] = [];

    // TODO: update query cache on success
    const createTagMutation = createMutation({
        mutationFn: createPrivateTag,
    });

    const tags = createQuery({queryKey: ['privateTags'], queryFn: listPrivateTags});

    $: if ($tags.isSuccess) {
        items = $tags.data.data.tags.map((item): Item => ({value: item.id, label: item.name}));
    }

    $: {
        if (
            initialValue &&
            (prevInitialValue.length !== initialValue.length ||
                !initialValue.every((value, index) => value === prevInitialValue[index]))
        ) {
            value = initialValue.map(item => ({value: item}));
        }
        prevInitialValue = initialValue ?? [];
    }

    $: selection = value.map(item => item.value);

    async function handleCreate(props: {
        inputValue: string;
        valueField: string;
        labelField: string;
        prefix: string;
    }) {
        const result = await $createTagMutation.mutateAsync({name: props.inputValue});
        return {value: result.data.id, label: result.data.name};
    }
</script>

<!-- TODO: add loading state -->
{#if !$tags.isLoading}
    <Svelecte
        inputId={id}
        placeholder="Не выбраны"
        highlightFirstItem={false}
        creatable={true}
        multiple={true}
        clearable={true}
        i18n={{
            createRowLabel: value => `Создать '${value}'`,
        }}
        options={items.sort((a, b) => a.label.localeCompare(b.label))}
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
        height: 38px;
        border-color: colors.$lightgray;
    }
</style>
