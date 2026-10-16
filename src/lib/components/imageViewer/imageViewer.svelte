<script lang="ts">
    import ZoomStage from '$lib/components/imageViewer/zoomStage.svelte';
    import {DialogTitle, Portal, Root} from '$lib/components/ui/dialog';
    import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
    import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
    import XIcon from '@lucide/svelte/icons/x';
    import {Dialog as DialogPrimitive} from 'bits-ui';

    interface Props {
        isOpen: boolean;
        urls: string[];
        index?: number;
    }

    let {isOpen = $bindable(), urls, index = $bindable(0)}: Props = $props();

    const surface = 'absolute bg-neutral-900 text-white shadow-lg ring-1 ring-white/10';
    const control = `${surface} flex size-10 items-center justify-center rounded-full transition-colors outline-none hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-40`;

    let shown = $derived(Math.min(index, urls.length - 1));

    function step(delta: number) {
        const next = shown + delta;
        if (next >= 0 && next < urls.length) {
            index = next;
        }
    }
</script>

<Root bind:open={isOpen}>
    <Portal>
        <DialogPrimitive.Content
            data-slot="dialog-content"
            class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 outline-none"
        >
            <DialogTitle class="sr-only">Просмотр изображения</DialogTitle>
            {#key urls[shown]}
                <ZoomStage url={urls[shown]} onClose={() => (isOpen = false)} onStep={step} />
            {/key}
            {#if urls.length > 1}
                <span
                    class="{surface} top-3 left-3 flex h-10 items-center rounded-full px-4 text-sm tabular-nums"
                >
                    {shown + 1} / {urls.length}
                </span>
                <button
                    type="button"
                    class="{control} top-1/2 left-3 -translate-y-1/2"
                    onclick={() => step(-1)}
                    disabled={shown === 0}
                    aria-label="Предыдущее фото"
                >
                    <ChevronLeftIcon class="size-5" />
                </button>
                <button
                    type="button"
                    class="{control} top-1/2 right-3 -translate-y-1/2"
                    onclick={() => step(1)}
                    disabled={shown === urls.length - 1}
                    aria-label="Следующее фото"
                >
                    <ChevronRightIcon class="size-5" />
                </button>
            {/if}
            <DialogPrimitive.Close class="{control} top-3 right-3" aria-label="Закрыть">
                <XIcon class="size-5" />
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </Portal>
</Root>
