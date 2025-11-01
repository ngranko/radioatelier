<script lang="ts">
    import {Root as DialogRoot, Content} from '$lib/components/ui/dialog';
    import UploadFile from '$lib/components/userMenu/import/uploadFile.svelte';
    import PreviewImport from '$lib/components/userMenu/import/preview.svelte';
    import Progress from '$lib/components/userMenu/import/progress.svelte';
    import {createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {listObjects} from '$lib/api/object.ts';
    import CloseConfirmation from '$lib/components/userMenu/import/closeConfirmation.svelte';
    import {
        ImportStepSuccess,
        ImportStepError,
        ImportStepPreview,
        ImportStepProgress,
        ImportStepUpload,
    } from '$lib/interfaces/import.ts';
    import {DialogHeader, DialogTitle} from '$lib/components/ui/dialog';
    import Success from '$lib/components/userMenu/import/success.svelte';
    import Error from '$lib/components/userMenu/import/error.svelte';
    import {importState, resetImportState} from '$lib/state/import.svelte.ts';

    const queryClient = useQueryClient();

    interface Props {
        isOpen: boolean;
    }

    let {isOpen = $bindable()}: Props = $props();
    let isConfirmationOpen = $state(false);

    const objects = createQuery({queryKey: ['objects'], queryFn: listObjects});

    function doClose() {
        isOpen = false;
        if (importState.provider.isRunning()) {
            importState.provider.cancel();
        }
        queryClient.invalidateQueries({queryKey: ['objects']}).then(() => $objects.refetch());
        resetImportState();
    }

    function getIsOpen() {
        return isOpen;
    }

    function setIsOpen(newOpen: boolean) {
        if (!newOpen && isDestructive()) {
            isConfirmationOpen = true;
        } else {
            isOpen = newOpen;
        }
    }

    function isDestructive(): boolean {
        return importState.step === ImportStepPreview || importState.step === ImportStepProgress;
    }
</script>

<!-- prettier-ignore -->
<DialogRoot bind:open={getIsOpen, setIsOpen}>
    <Content class="max-h-[95vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Импорт csv</DialogTitle>
        </DialogHeader>
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
