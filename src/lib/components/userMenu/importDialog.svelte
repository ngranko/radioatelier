<script lang="ts">
    import {goto} from '$app/navigation';
    import DialogHeading from '$lib/components/dialogHeading.svelte';
    import {Root as DialogRoot, Content} from '$lib/components/ui/dialog';
    import CloseConfirmation from '$lib/components/userMenu/import/closeConfirmation.svelte';
    import Error from '$lib/components/userMenu/import/error.svelte';
    import PreviewImport from '$lib/components/userMenu/import/preview.svelte';
    import Progress from '$lib/components/userMenu/import/progress.svelte';
    import Success from '$lib/components/userMenu/import/success.svelte';
    import UploadFile from '$lib/components/userMenu/import/uploadFile.svelte';
    import {
        ImportStepSuccess,
        ImportStepError,
        ImportStepPreview,
        ImportStepProgress,
        ImportStepUpload,
    } from '$lib/interfaces/import.ts';
    import {importState, resetImportState} from '$lib/state/import.svelte.ts';
    import FileInputIcon from '@lucide/svelte/icons/file-input';

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();
    let isConfirmationOpen = $state(false);

    function doClose() {
        isOpen = false;
        if (importState.provider?.isRunning()) {
            importState.provider.cancel();
        }
        resetImportState();
        goto('/');
    }

    function getIsOpen() {
        return isOpen;
    }

    function setIsOpen(newOpen: boolean) {
        if (newOpen) {
            return;
        }

        if (isDestructive()) {
            isConfirmationOpen = true;
        } else {
            doClose();
        }
    }

    function isDestructive(): boolean {
        return importState.step === ImportStepPreview || importState.step === ImportStepProgress;
    }
</script>

<!-- prettier-ignore -->
<DialogRoot bind:open={getIsOpen, setIsOpen}>
    <Content class="max-h-[95vh] flex flex-col overflow-hidden border-t-0 pt-0">
        <DialogHeading
            icon={FileInputIcon}
            title="Импорт CSV"
            hint="Добавление точек на карту из таблицы"
            class="-mx-6"
        />
        {#if importState.step === ImportStepUpload}
            <UploadFile />
        {:else if importState.step === ImportStepPreview}
            <PreviewImport />
        {:else if importState.step === ImportStepProgress}
            <Progress />
        {:else if importState.step === ImportStepSuccess}
            <Success />
        {:else if importState.step === ImportStepError}
            <Error />
        {/if}
    </Content>
</DialogRoot>

<CloseConfirmation bind:isOpen={isConfirmationOpen} onClick={doClose} />
