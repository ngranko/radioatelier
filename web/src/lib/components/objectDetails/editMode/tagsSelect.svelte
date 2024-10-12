<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {createTag, listTags} from '$lib/api/tag';
    import Svelecte from 'svelecte';
    import type {Payload} from '$lib/interfaces/api';
    import type {ListTagsResponsePayload} from '$lib/interfaces/tag';
    import {createEventDispatcher} from 'svelte';

    const client = useQueryClient();
    const dispatch = createEventDispatcher();

    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let value: string[] = [];

    $: console.log(value);

    const createTagMutation = createMutation({
        mutationFn: createTag,
        onSuccess: ({data}) => {
            const cachedValue: Payload<ListTagsResponsePayload> | undefined = client.getQueryData([
                'tags',
            ]);
            if (cachedValue) {
                client.setQueryData(['tags'], {data: {tags: [...cachedValue.data.tags, data]}});
            }
        },
    });

    const tags = createQuery({queryKey: ['tags'], queryFn: listTags});

    async function handleCreate(props: {
        inputValue: string;
        valueField: string;
        labelField: string;
        prefix: string;
    }) {
        const result = await $createTagMutation.mutateAsync({name: props.inputValue});
        return {id: result.data.id, name: result.data.name};
    }
</script>

<!-- TODO: add loading state -->
{#if !$tags.isLoading}
    <Svelecte
        on:change
        inputId={id}
        placeholder="Не выбраны"
        highlightFirstItem={false}
        creatable={true}
        multiple={true}
        clearable={true}
        i18n={{
            createRowLabel: value => `Создать '${value}'`,
        }}
        options={$tags.data?.data.tags.sort((a, b) => a.name.localeCompare(b.name))}
        {name}
        {value}
        createHandler={handleCreate}
    />
{/if}

<style lang="scss">
    @use '../../../../styles/colors';
    @use '../../../../styles/typography';

    :global(.creatable-row) {
        @include typography.brand-face;
    }

    :global(.svelecte .sv-control) {
        --sv-min-height: 38px;
        border-color: colors.$gray;
    }
</style>
