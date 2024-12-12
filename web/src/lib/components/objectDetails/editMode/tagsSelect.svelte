<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {createTag, listTags} from '$lib/api/tag';
    import Svelecte from 'svelecte';
    import type {Payload} from '$lib/interfaces/api';
    import type {ListTagsResponsePayload, Tag} from '$lib/interfaces/tag';
    import {clsx} from 'clsx';

    const client = useQueryClient();

    interface Props {
        id?: string;
        name?: string;
        value?: (string | undefined)[];
        error: any[] | null;
        onChange?(value: Tag[]): void;
    }

    let {id = undefined, name = undefined, value = [], error = null, onChange}: Props = $props();

    let classes: string = $derived(
        clsx({
            field: true,
            error: hasError(),
        }),
    );

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

    function getErrorMessage(): string | undefined {
        if (!error) {
            return undefined;
        }

        for (const item of error) {
            if (item.id?.length > 0) {
                return item.id[0];
            }
        }
        return undefined;
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

<div class={classes}>
    <label for={id} class="label">{getErrorMessage() ?? 'Теги'}</label>
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
            options={$tags.data?.data.tags.sort((a, b) => a.name.localeCompare(b.name))}
            {name}
            {value}
            createHandler={handleCreate}
        />
    {/if}
</div>

<style lang="scss">
    @use '../../../../styles/colors';
    @use '../../../../styles/typography';

    .field {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    :global(.creatable-row) {
        @include typography.brand-face;
    }

    :global(.svelecte.svelecte-control .sv-control) {
        --sv-min-height: 38px;
        border-color: colors.$gray;
    }

    .error {
        & label {
            color: colors.$danger;
        }

        :global(.svelecte.svelecte-control .sv-control) {
            border-color: colors.$danger;
        }
    }

    .label {
        @include typography.size-14;
        margin-bottom: 4px;
        transition: color 0.2s;
    }
</style>
