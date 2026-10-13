<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import MinusIcon from '@lucide/svelte/icons/minus';
    import PlusIcon from '@lucide/svelte/icons/plus';

    interface Props {
        scale: number;
        maxScale: number;
        onZoomIn(): void;
        onZoomOut(): void;
        onReset(): void;
    }

    let {scale, maxScale, onZoomIn, onZoomOut, onReset}: Props = $props();

    const control =
        'rounded-full text-white hover:bg-white/15 hover:text-white dark:hover:bg-white/15';
</script>

<div
    class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-900 p-1 shadow-lg ring-1 ring-white/10"
>
    <Button
        variant="ghost"
        size="icon"
        class={control}
        onclick={onZoomOut}
        disabled={scale <= 1}
        aria-label="Уменьшить"
    >
        <MinusIcon />
    </Button>
    <Button
        variant="ghost"
        class="{control} w-16 px-0 text-sm tabular-nums"
        onclick={onReset}
        disabled={scale === 1}
        aria-label="Сбросить масштаб"
    >
        {Math.round(scale * 100)}%
    </Button>
    <Button
        variant="ghost"
        size="icon"
        class={control}
        onclick={onZoomIn}
        disabled={scale >= maxScale}
        aria-label="Увеличить"
    >
        <PlusIcon />
    </Button>
</div>
