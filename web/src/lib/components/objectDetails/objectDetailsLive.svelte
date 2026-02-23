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

    const values = $derived((liveObject.data ?? queryInitialData) as Object);
    const canEditAll = $derived(permissions.canEditAll && values.isOwner);
    const canEditPersonal = $derived(permissions.canEditPersonal && !values.isOwner);
</script>

<!-- TODO: add an error state -->
{#if canEditAll && isEditing}
    <Form initialValues={values} />
{:else if canEditPersonal && isEditing}
    <LightForm initialValues={values} />
{:else}
    <ViewMode initialValues={values} permissions={{canEditAll, canEditPersonal}} />
{/if}
