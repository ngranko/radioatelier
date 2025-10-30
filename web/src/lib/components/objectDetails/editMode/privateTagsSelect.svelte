<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {Combobox} from '$lib/components/ui/combobox';
    import {createPrivateTag, listPrivateTags} from '$lib/api/privateTag';
    import type {Payload} from '$lib/interfaces/api';
    import type {ListPrivateTagsResponsePayload} from '$lib/interfaces/privateTag';
    import type {Tag} from '$lib/interfaces/tag';
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

    async function handleCreate(inputValue: string): Promise<Tag> {
        const result = await $createTagMutation.mutateAsync({name: inputValue});
        return {id: result.data.id, name: result.data.name};
    }

    function getCreateRowLabel(value: string) {
        return `Создать '${value}'`;
    }

    function handleChange(tags: Tag[] | null) {
        onChange?.(tags || []);
    }
</script>

<!-- TODO: add loading state -->
{#if !$tags.isLoading}
    <Combobox
        onChange={handleChange}
        {id}
        placeholder="Не выбраны"
        creatable={true}
        multiple={true}
        createLabel={getCreateRowLabel}
        options={sortedTags}
        {name}
        {value}
        onCreate={handleCreate}
        error={hasError()}
        class={cn({'transition-colors': true})}
    />
{/if}
