<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import type {ObjectImage} from '$lib/interfaces/object';
    import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
    import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

    interface Props {
        images: ObjectImage[];
        index?: number;
        /** Labels this image's slide, for the mode where the cover can be changed. */
        coverId?: string;
        disabled?: boolean;
        onOpen(): void;
    }

    let {images, index = $bindable(0), coverId, disabled = false, onOpen}: Props = $props();

    const badge =
        'pointer-events-none absolute left-3 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white';
    const arrow =
        'text-foreground/80 absolute top-1/2 size-7 -translate-y-1/2 rounded-full opacity-0 shadow-sm group-hover/carousel:opacity-100 focus-visible:opacity-100 pointer-coarse:hidden';

    let strip: HTMLElement | undefined = $state();
    let shown = $derived(Math.min(index, images.length - 1));

    // `index` only ever follows the scroll position, so a swipe, an arrow and
    // a jump from outside cannot disagree about which slide is in view
    export function show(target: number, behavior: ScrollBehavior = 'smooth') {
        strip?.scrollTo({left: target * strip.clientWidth, behavior});
    }

    function trackIndex() {
        if (strip) {
            index = Math.round(strip.scrollLeft / strip.clientWidth);
        }
    }
</script>

<div class="group/carousel relative">
    <div
        bind:this={strip}
        class="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
        onscroll={trackIndex}
    >
        {#each images as image (image.id)}
            <button
                type="button"
                class="group bg-muted relative block aspect-2/1 w-full shrink-0 cursor-zoom-in snap-center overflow-hidden border-none"
                onclick={onOpen}
                {disabled}
                aria-label="Открыть оригинал изображения"
                aria-busy={disabled}
            >
                <img
                    class="h-full w-full object-cover transition-transform ease-out group-hover:scale-[1.03]"
                    src={image.previewUrl || image.url}
                    alt="Изображение"
                />
                {#if image.id === coverId}
                    <span class="{badge} top-3">обложка</span>
                {/if}
            </button>
        {/each}
    </div>
    {#if images.length > 1}
        <span class="{badge} bottom-3 tabular-nums">{shown + 1} / {images.length}</span>
        {#if shown > 0}
            <Button
                variant="secondary"
                size="icon"
                class="{arrow} left-2"
                onclick={() => show(shown - 1)}
                aria-label="Предыдущее фото"
            >
                <ChevronLeftIcon />
            </Button>
        {/if}
        {#if shown < images.length - 1}
            <Button
                variant="secondary"
                size="icon"
                class="{arrow} right-2"
                onclick={() => show(shown + 1)}
                aria-label="Следующее фото"
            >
                <ChevronRightIcon />
            </Button>
        {/if}
    {/if}
</div>
