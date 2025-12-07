<script lang="ts">
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {sharedMarker} from '$lib/state/sharedMarker.svelte.ts';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';

    let {data, children} = $props();
</script>

{#if activeObject.object}
    <ObjectDetails
        initialValues={activeObject.object}
        key={activeObject.detailsId}
        isEditing={activeObject.isEditing}
        permissions={{
            canEditAll:
                data.user.auth &&
                activeObject.object.id !== sharedMarker.object?.id &&
                activeObject.object.isOwner,
            canEditPersonal:
                data.user.auth &&
                activeObject.object.id !== sharedMarker.object?.id &&
                !activeObject.object.isOwner,
        }}
    />
{/if}

{@render children?.()}
