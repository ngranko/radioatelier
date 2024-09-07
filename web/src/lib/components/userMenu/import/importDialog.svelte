<script lang="ts">
    import Dialog from '$lib/components/dialog.svelte';
    import UploadFile from '$lib/components/userMenu/import/uploadFile.svelte';
    import PreviewImport from '$lib/components/userMenu/import/previewImport.svelte';
    import Progress from '$lib/components/userMenu/import/progress.svelte';
    import CloseConfirmation from '$lib/components/userMenu/import/closeConfirmation.svelte';
    import {importInfo} from '$lib/stores/import';

    export let isOpen = false;
    let isConfirmationOpen = false;

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
    }
</script>

<Dialog bind:isOpen on:close={handleClose}>
    {#if $importInfo.currentStep === 1}
        <UploadFile on:close={handleClose} />
    {:else if $importInfo.currentStep === 2}
        <PreviewImport on:close={handleClose} />
    {:else if $importInfo.currentStep === 3}
        <Progress on:close={handleClose} />
    {/if}
</Dialog>
<CloseConfirmation bind:isOpen={isConfirmationOpen} on:click={doClose} />

<style lang="scss">
    @use '../../../../styles/colors';
    @use '../../../../styles/typography';
</style>
