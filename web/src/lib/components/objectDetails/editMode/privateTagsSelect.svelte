<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import Combobox from '$lib/components/input/combobox.svelte';
    import {createPrivateTag, listPrivateTags} from '$lib/api/privateTag';
    import type {Payload} from '$lib/interfaces/api';
    import type {ListPrivateTagsResponsePayload} from '$lib/interfaces/privateTag';
    import type {Tag} from '$lib/interfaces/tag';
    import {cn} from '$lib/utils.ts';

    const client = useQueryClient();

    interface Props {
        name?: string;
        value?: string[];
        error: any[] | null;
        onChange?(value: string[]): void;
    }

    let {name = undefined, value = [], error = null, onChange}: Props = $props();

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

    async function handleCreate(inputValue: string): Promise<Tag> {
        const result = await $createTagMutation.mutateAsync({name: inputValue});
        return {id: result.data.id, name: result.data.name};
    }

    function handleChange(tags: string[]) {
        onChange?.(tags || []);
    }
</script>

<!-- TODO: add loading state -->
{#if !$tags.isLoading}
    <Combobox
        onChange={handleChange}
        placeholder="Не выбраны"
        creatable={true}
        multiple={true}
        options={sortedTags}
        {name}
        value={value ?? []}
        onCreate={handleCreate}
        error={!!error}
        class={cn({'transition-colors': true})}
        wrapperClass="w-full"
    />
{/if}
