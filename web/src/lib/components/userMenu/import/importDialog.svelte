<script lang="ts">
    import Dialog from '$lib/components/dialog.svelte';
    import UploadFile from '$lib/components/userMenu/import/uploadFile.svelte';
    import PreviewImport from '$lib/components/userMenu/import/previewImport.svelte';
    import Progress from '$lib/components/userMenu/import/progress.svelte';
    import CloseConfirmation from '$lib/components/userMenu/import/closeConfirmation.svelte';
    import {importInfo} from '$lib/stores/import';
    import {createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {listObjects} from '$lib/api/object';

    const queryClient = useQueryClient();

    interface Props {
        isOpen?: boolean;
    }

    let {isOpen = $bindable(false)}: Props = $props();
    let isConfirmationOpen = $state(false);

    const objects = createQuery({queryKey: ['objects'], queryFn: listObjects});

    function handleClose() {
        if ($importInfo.provider.isRunning()) {
            isConfirmationOpen = true;
        } else {
            doClose();
        }
    }

    function doClose() {
        isOpen = false;
        if ($importInfo.provider.isRunning()) {
            $importInfo.provider.cancel();
        }
        importInfo.reset();
        queryClient.invalidateQueries({queryKey: ['objects']}).then(() => $objects.refetch());
    }
</script>

<Dialog bind:isOpen onClose={handleClose}>
    {#if $importInfo.currentStep === 1}
        <UploadFile onClose={handleClose} />
    {:else if $importInfo.currentStep === 2}
        <PreviewImport onClose={handleClose} />
    {:else if $importInfo.currentStep === 3}
        <Progress onClose={handleClose} />
    {/if}
</Dialog>
<CloseConfirmation bind:isOpen={isConfirmationOpen} onClick={doClose} />

<style lang="scss">
    @use '../../../../styles/colors';
    @use '../../../../styles/typography';
</style>
