<script lang="ts">
    import ZoomStage from '$lib/components/imageViewer/zoomStage.svelte';
    import {DialogTitle, Portal, Root} from '$lib/components/ui/dialog';
    import XIcon from '@lucide/svelte/icons/x';
    import {Dialog as DialogPrimitive} from 'bits-ui';

    interface Props {
        isOpen: boolean;
        url: string;
    }

    let {isOpen = $bindable(), url}: Props = $props();
</script>

<Root bind:open={isOpen}>
    <Portal>
        <DialogPrimitive.Content
            data-slot="dialog-content"
            class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 outline-none"
        >
            <DialogTitle class="sr-only">Просмотр изображения</DialogTitle>
            <ZoomStage {url} onClose={() => (isOpen = false)} />
            <DialogPrimitive.Close
                class="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg ring-1 ring-white/10 transition-colors outline-none hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-white/60"
                aria-label="Закрыть"
            >
                <XIcon class="size-5" />
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </Portal>
</Root>
