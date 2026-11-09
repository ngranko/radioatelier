<script lang="ts">
    import {SwipeTrack} from '$lib/components/imageViewer/swipeTrack.svelte';
    import ZoomStage from '$lib/components/imageViewer/zoomStage.svelte';
    import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
    import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
    import XIcon from '@lucide/svelte/icons/x';
    import {Dialog as DialogPrimitive} from 'bits-ui';

    interface Props {
        urls: string[];
        index: number;
        onClose(): void;
    }

    let {urls, index = $bindable(), onClose}: Props = $props();

    const surface = 'absolute bg-neutral-900 text-white shadow-lg ring-1 ring-white/10';
    const control = `${surface} flex size-10 items-center justify-center rounded-full transition-colors outline-none hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-40`;

    const BACKDROP_ALPHA = 0.9;
    const FADE_DISTANCE = 360;

    // The bound index can lag behind: the carousel only learns it from its next scroll event.
    // The slides have to shift in the same frame as the track offset that makes up for it.
    let selected = $state(index);
    let shown = $derived(Math.min(selected, urls.length - 1));

    const track = new SwipeTrack({
        getCount: () => urls.length,
        getIndex: () => shown,
        setIndex: next => {
            selected = next;
            index = next;
        },
        close: () => onClose(),
    });

    let backdropAlpha = $derived(
        BACKDROP_ALPHA * (1 - Math.min(Math.abs(track.pull) / FADE_DISTANCE, 0.6)),
    );
</script>

<div
    bind:clientWidth={track.width}
    class="absolute inset-0 overflow-hidden"
    style:background-color="rgb(0 0 0 / {backdropAlpha})"
>
    {#each urls as url, i (i)}
        {#if track.isNear(i - shown)}
            <ZoomStage
                {url}
                isActive={i === shown}
                shift={{x: track.locate(i - shown), y: track.pull}}
                dragHandlers={track}
                {onClose}
                onSwitchImage={track.step}
            />
        {/if}
    {/each}
</div>

{#if urls.length > 1}
    <span
        class="{surface} top-3 left-3 flex h-10 items-center rounded-full px-4 text-sm tabular-nums"
    >
        {shown + 1} / {urls.length}
    </span>
    <button
        type="button"
        class="{control} top-1/2 left-3 -translate-y-1/2"
        onclick={() => track.step(-1)}
        disabled={shown === 0}
        aria-label="Предыдущее фото"
    >
        <ChevronLeftIcon class="size-5" />
    </button>
    <button
        type="button"
        class="{control} top-1/2 right-3 -translate-y-1/2"
        onclick={() => track.step(1)}
        disabled={shown === urls.length - 1}
        aria-label="Следующее фото"
    >
        <ChevronRightIcon class="size-5" />
    </button>
{/if}
<DialogPrimitive.Close class="{control} top-3 right-3" aria-label="Закрыть">
    <XIcon class="size-5" />
</DialogPrimitive.Close>
