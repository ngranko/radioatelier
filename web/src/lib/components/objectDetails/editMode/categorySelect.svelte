<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {createCategory, listCategories} from '$lib/api/category';
    import Svelecte from 'svelecte';
    import type {Payload} from '$lib/interfaces/api';
    import type {ListCategoriesResponsePayload} from '$lib/interfaces/category.js';
    import {clsx} from 'clsx';

    const client = useQueryClient();

    export let id: string | undefined = undefined;
    export let name: string | undefined = undefined;
    export let value: string | undefined;
    export let error: string[] | null | undefined = undefined;

    let classes: string;
    let isError: boolean;

    $: isError = Boolean(error);
    $: classes = clsx({
        field: true,
        error: isError,
    });

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

<div class={classes}>
    <label for={id} class="label">{error ? error[0] : 'Категория'}</label>
    <!-- TODO: add loading state -->
    {#if !$categories.isLoading}
        <Svelecte
            on:change
            inputId={id}
            placeholder="Не выбрана"
            highlightFirstItem={false}
            creatable={true}
            i18n={{
                createRowLabel: value => `Создать '${value}'`,
            }}
            options={$categories.data?.data.categories.sort((a, b) => a.name.localeCompare(b.name))}
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
