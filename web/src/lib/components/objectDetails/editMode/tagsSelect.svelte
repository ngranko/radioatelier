<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {createTag, listTags} from '$lib/api/tag';
    import Svelecte from 'svelecte';
    import type {Payload} from '$lib/interfaces/api';
    import type {ListTagsResponsePayload, Tag} from '$lib/interfaces/tag';
    import {cn} from '$lib/utils.ts';

    const client = useQueryClient();

    interface Props {
        id?: string;
        name?: string;
        value?: (string | undefined)[];
        error: any[] | null;
        onChange?(value: Tag[]): void;
    }

    let {id = undefined, name = undefined, value = [], error = null, onChange}: Props = $props();

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

    const sortedTags = $derived(
        $tags.data?.data.tags
            ? [...$tags.data.data.tags].sort((a, b) => a.name.localeCompare(b.name))
            : [],
    );

    function hasError(): boolean {
        if (!error) {
            return false;
        }

        for (const item of error) {
            if (item.id?.length > 0) {
                return true;
            }
        }

        return false;
    }

    async function handleCreate(props: {
        inputValue: string;
        valueField: string;
        labelField: string;
        prefix: string;
    }) {
        const result = await $createTagMutation.mutateAsync({name: props.inputValue});
        return {id: result.data.id, name: result.data.name};
    }

    function getCreateRowLabel(value: string) {
        return `Создать '${value}'`;
    }
</script>

<!-- TODO: add loading state -->
{#if !$tags.isLoading}
    <Svelecte
        {onChange}
        inputId={id}
        placeholder="Не выбраны"
        highlightFirstItem={false}
        creatable={true}
        multiple={true}
        clearable={true}
        i18n={{
            createRowLabel: getCreateRowLabel,
        }}
        options={sortedTags}
        {name}
        {value}
        createHandler={handleCreate}
        controlClass={cn({'transition-colors': true, 'sv-control-error': hasError()})}
    />
{/if}
