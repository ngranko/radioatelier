<script lang="ts">
    import {goto} from '$app/navigation';
    import Background from '$lib/components/objectDetails/background.svelte';
    import CloseConfirmDialog from '$lib/components/objectDetails/closeConfirmDialog.svelte';
    import DetailsContent from '$lib/components/objectDetails/detailsContent.svelte';
    import DetailsHeader from '$lib/components/objectDetails/detailsHeader.svelte';
    import DetailsSheet from '$lib/components/objectDetails/detailsSheet.svelte';
    import type {LooseObject, PointPreviewDetails} from '$lib/interfaces/object';
    import type {Permissions} from '$lib/interfaces/permissions';
    import {setCreateDraftPosition} from '$lib/state/createDraft.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import {
        objectDetailsOverlay,
        closeDetailsOverlay,
        setOverlayPosition,
    } from '$lib/state/objectDetailsOverlay.svelte';
    import type {ObjectDetailsOverlayMode} from '$lib/state/objectDetailsOverlay.svelte';
    import {getActiveSearchUrl} from '$lib/state/search.svelte';
    import {registerEscapeCloseHandler} from '$lib/utils/escapeClose';
    import {onMount} from 'svelte';
    import {useClerkContext} from 'svelte-clerk';

    interface Props {
        initialValues?: Partial<LooseObject>;
        pointDetails?: PointPreviewDetails | null;
        mode?: ObjectDetailsOverlayMode;
        permissions?: Permissions;
    }

    const ctx = useClerkContext();

    let {
        initialValues = $bindable(),
        pointDetails = null,
        mode = 'objectView',
        permissions = {canEditAll: true, canEditPersonal: true},
    }: Props = $props();

    let isCloseConfirmOpen = $state(false);
    let closeConfirmationCheck = $state<(() => boolean) | null>(null);

    const resolvedInitialValues = $derived(initialValues ?? {});
    const resolvedMode = $derived(objectDetailsOverlay.isOpen ? objectDetailsOverlay.mode : mode);
    const resolvedPointDetails = $derived(
        objectDetailsOverlay.isOpen
            ? (objectDetailsOverlay.pointDetails ?? pointDetails)
            : pointDetails,
    );

    function handleMinimizeClick() {
        setOverlayPosition(objectDetailsOverlay.position === 'full' ? 'minimized' : 'full');
    }

    function handleClose() {
        isCloseConfirmOpen = false;
        setCreateDraftPosition(null);
        closeDetailsOverlay();
        if (mapState.isReady) {
            mapState.provider!.closeStreetView();
        }

        if (ctx.auth.userId) {
            closeDetailsOverlay();
            goto(getActiveSearchUrl());
        } else {
            // this is for a case when a user is not logged in and wants to close the details overlay
            // otherwise I'll lose the values and will use the server fallback
            // TODO: in the future it's best to come up with a better solution
            closeDetailsOverlay({preserveDetails: true});
        }
    }

    function registerCloseConfirmationCheck(check: () => boolean) {
        closeConfirmationCheck = check;

        return () => {
            if (closeConfirmationCheck === check) {
                closeConfirmationCheck = null;
            }
        };
    }

    function isCloseConfirmationRequired() {
        return closeConfirmationCheck?.() === true;
    }

    function requestClose() {
        if (isCloseConfirmationRequired()) {
            isCloseConfirmOpen = true;
            return;
        }

        handleClose();
    }

    onMount(() =>
        registerEscapeCloseHandler({
            priority: 20,
            isActive: () => objectDetailsOverlay.isOpen,
            close: requestClose,
        }),
    );
</script>

<Background onRequestClose={requestClose} />
<CloseConfirmDialog bind:open={isCloseConfirmOpen} onConfirmClose={handleClose} />
<DetailsSheet>
    {#snippet header(sheet)}
        <DetailsHeader
            initialValues={resolvedInitialValues}
            isDragging={sheet.isDragging}
            isMinimized={objectDetailsOverlay.isMinimized}
            position={objectDetailsOverlay.position}
            onDragCancel={sheet.onDragCancel}
            onDragEnd={sheet.onDragEnd}
            onDragMove={sheet.onDragMove}
            onDragStart={sheet.onDragStart}
            onRequestClose={requestClose}
            onTogglePosition={handleMinimizeClick}
        />
    {/snippet}
    <DetailsContent
        initialValues={resolvedInitialValues}
        isLoading={objectDetailsOverlay.isLoading}
        mode={resolvedMode}
        {permissions}
        pointDetails={resolvedPointDetails}
        {registerCloseConfirmationCheck}
    />
</DetailsSheet>
