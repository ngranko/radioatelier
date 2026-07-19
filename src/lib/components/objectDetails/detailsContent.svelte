<script lang="ts">
    import ObjectEdit from '$lib/components/objectDetails/objectEdit.svelte';
    import PointCreate from '$lib/components/objectDetails/pointCreate.svelte';
    import PointPreview from '$lib/components/objectDetails/pointPreview.svelte';
    import ViewMode from '$lib/components/objectDetails/viewMode/viewMode.svelte';
    import ViewModeSkeleton from '$lib/components/objectDetails/viewMode/viewModeSkeleton.svelte';
    import type {
        LooseObject,
        Object as ObjectType,
        PointPreviewDetails,
    } from '$lib/interfaces/object';
    import type {Permissions} from '$lib/interfaces/permissions';
    import type {ObjectDetailsOverlayMode} from '$lib/state/objectDetailsOverlay.svelte';
    import {fade} from 'svelte/transition';

    interface Props {
        initialValues: Partial<LooseObject>;
        isLoading: boolean;
        mode: ObjectDetailsOverlayMode;
        permissions: Permissions;
        pointDetails?: PointPreviewDetails | null;
        registerCloseConfirmationCheck: (check: () => boolean) => () => void;
    }

    let {
        initialValues,
        isLoading,
        mode,
        permissions,
        pointDetails = null,
        registerCloseConfirmationCheck,
    }: Props = $props();
</script>

<div class="relative flex-1 overflow-hidden">
    <div
        class="absolute inset-0 flex flex-col"
        in:fade={{duration: 150}}
        out:fade={{duration: 150}}
    >
        {#if isLoading}
            <ViewModeSkeleton />
        {:else if mode === 'objectEdit' && initialValues.id}
            <ObjectEdit
                initialValues={initialValues as ObjectType}
                {permissions}
                {registerCloseConfirmationCheck}
            />
        {:else if mode === 'pointPreview' && pointDetails}
            <PointPreview details={pointDetails} />
        {:else if mode === 'pointCreate'}
            <PointCreate {initialValues} {registerCloseConfirmationCheck} />
        {:else}
            <ViewMode {initialValues} {permissions} />
        {/if}
    </div>
</div>
