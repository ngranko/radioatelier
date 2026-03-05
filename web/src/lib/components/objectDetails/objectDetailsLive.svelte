<script lang="ts">
    import {useQuery} from 'convex-svelte';
    import {api} from '$convex/_generated/api';
    import type {Id} from '$convex/_generated/dataModel';
    import type {Object} from '$lib/interfaces/object';
    import type {Permissions} from '$lib/interfaces/permissions';
    import Form from '$lib/components/objectDetails/editMode/form.svelte';
    import LightForm from '$lib/components/objectDetails/editMode/lightForm.svelte';
    import ViewMode from '$lib/components/objectDetails/viewMode/viewMode.svelte';

    interface Props {
        initialValues: Object;
        isEditing?: boolean;
        permissions: Permissions;
    }

    let {initialValues, isEditing = false, permissions}: Props = $props();
    const queryInitialData = {
        ...initialValues,
    };

    const liveObject = useQuery(
        api.objects.getDetails,
        {id: initialValues.id as Id<'objects'>},
        {initialData: queryInitialData},
    );

    const liveValues = $derived((liveObject.data ?? queryInitialData) as Object);
    const canEditAll = $derived(permissions.canEditAll && liveValues.isOwner);
    const canEditPersonal = $derived(permissions.canEditPersonal && !liveValues.isOwner);

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
        if (isEditing) {
            if (!editSnapshot || snapshotObjectId !== currentId) {
                editSnapshot = cloneObjectSnapshot(liveValues);
                snapshotObjectId = currentId;
            }
        } else {
            editSnapshot = null;
            snapshotObjectId = null;
        }
    });

    const formValues = $derived((isEditing && editSnapshot ? editSnapshot : liveValues) as Object);
</script>

<!-- TODO: add an error state -->
{#if canEditAll && isEditing}
    <Form initialValues={formValues} />
{:else if canEditPersonal && isEditing}
    <LightForm initialValues={formValues} />
{:else}
    <ViewMode initialValues={liveValues} permissions={{canEditAll, canEditPersonal}} />
{/if}
