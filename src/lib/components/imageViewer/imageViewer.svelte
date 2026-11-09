<script lang="ts">
    import ImageGallery from '$lib/components/imageViewer/imageGallery.svelte';
    import {DialogTitle, Portal, Root} from '$lib/components/ui/dialog';
    import {Dialog as DialogPrimitive} from 'bits-ui';

    interface Props {
        isOpen: boolean;
        urls: string[];
        index?: number;
    }

    let {isOpen = $bindable(), urls, index = $bindable(0)}: Props = $props();
</script>

<Root bind:open={isOpen}>
    <Portal>
        <DialogPrimitive.Content
            data-slot="dialog-content"
            class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 outline-none"
        >
            <DialogTitle class="sr-only">Просмотр изображения</DialogTitle>
            <ImageGallery {urls} bind:index onClose={() => (isOpen = false)} />
        </DialogPrimitive.Content>
    </Portal>
</Root>
