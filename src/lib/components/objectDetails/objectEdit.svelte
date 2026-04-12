<script lang="ts">
    import type {Id} from '$convex/_generated/dataModel';
    import type {Object} from '$lib/interfaces/object';
    import type {Permissions} from '$lib/interfaces/permissions';
    import Form from '$lib/components/objectDetails/objectForm/form.svelte';
    import LightForm from '$lib/components/objectDetails/objectForm/lightForm.svelte';

    interface Props {
        initialValues: Object;
        permissions: Permissions;
    }

    let {initialValues: liveValues, permissions}: Props = $props();

    function cloneObjectSnapshot(value: Object): Object {
        return {
            ...value,
            category: {...value.category},
            tags: value.tags.map(tag => ({...tag})),
            privateTags: value.privateTags.map(tag => ({...tag})),
            cover: value.cover ? {...value.cover} : null,
        };
    }

    let editSnapshot = $state<Object | null>(null);
    let snapshotObjectId = $state<Id<'objects'> | null>(null);

    $effect(() => {
        const currentId = liveValues.id;
        if (!editSnapshot || snapshotObjectId !== currentId) {
            editSnapshot = cloneObjectSnapshot(liveValues);
            snapshotObjectId = currentId;
        }
    });

    const formValues = $derived(editSnapshot ?? liveValues);
</script>

<!-- TODO: add an error state -->
{#if permissions.canEditAll}
    <Form initialValues={formValues} />
{:else if permissions.canEditPersonal}
    <LightForm initialValues={formValues} />
{/if}
