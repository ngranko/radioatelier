<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import Svelecte from 'svelecte';
    import {createPrivateTag, listPrivateTags} from '$lib/api/privateTag';
    import type {Payload} from '$lib/interfaces/api';
    import type {ListPrivateTagsResponsePayload} from '$lib/interfaces/privateTag';
    import {clsx} from 'clsx';

    const client = useQueryClient();

    interface Props {
        id: string | undefined;
        name: string | undefined;
        value?: (string | undefined)[];
        error?: string[] | null | undefined;
    }

    let {
        id = undefined,
        name = undefined,
        value = $bindable([]),
        error = undefined,
    }: Props = $props();

    let isError: boolean = $derived(Boolean(error));
    let classes: string = $derived(
        clsx({
            field: true,
            error: isError,
        }),
    );

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

    function getCreateRowLabel(value: string) {
        return `Создать '${value}'`;
    }
</script>

<div class={classes}>
    <label for={id} class="label">{error ? error[0] : 'Приватные теги'}</label>
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
                createRowLabel: getCreateRowLabel,
            }}
            options={$tags.data?.data.tags.sort((a, b) => a.name.localeCompare(b.name))}
            {name}
            bind:value
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
