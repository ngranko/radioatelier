<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import Svelecte from 'svelecte';
    import {createPrivateTag, listPrivateTags} from '$lib/api/privateTag';
    import type {Payload} from '$lib/interfaces/api';
    import type {ListPrivateTagsResponsePayload} from '$lib/interfaces/privateTag';

    const client = useQueryClient();

    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let value: string[] = [];

    const createTagMutation = createMutation({
        mutationFn: createPrivateTag,
        onSuccess: ({data}) => {
            const cachedValue: Payload<ListPrivateTagsResponsePayload> | undefined =
                client.getQueryData(['privateTags']);
            if (cachedValue) {
                client.setQueryData(['privateTags'], {
                    data: {tags: [...cachedValue.data.tags, data]},
                });
            }
        },
    });

    const tags = createQuery({queryKey: ['privateTags'], queryFn: listPrivateTags});

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
        bind:value
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
