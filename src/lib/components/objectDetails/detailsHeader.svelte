<script lang="ts">
    import CategoryBadge from '$lib/components/categoryBadge.svelte';
    import CloseButton from '$lib/components/objectDetails/closeButton.svelte';
    import {badgeVariants} from '$lib/components/ui/badge';
    import {Button} from '$lib/components/ui/button';
    import type {LooseObject} from '$lib/interfaces/object';
    import type {ObjectDetailsOverlayPosition} from '$lib/state/objectDetailsOverlay.svelte';
    import {cn} from '$lib/utils.ts';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
    import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
    import {toast} from 'svelte-sonner';

    interface Props {
        initialValues: Partial<LooseObject>;
        isDragging: boolean;
        isMinimized: boolean;
        position: ObjectDetailsOverlayPosition;
        onDragCancel(): void;
        onDragEnd(): void;
        onDragMove(evt: PointerEvent): void;
        onDragStart(evt: PointerEvent): void;
        onRequestClose(): void;
        onTogglePosition(): void;
    }

    let {
        initialValues,
        isDragging,
        isMinimized,
        position,
        onDragCancel,
        onDragEnd,
        onDragMove,
        onDragStart,
        onRequestClose,
        onTogglePosition,
    }: Props = $props();

    async function copyInternalId(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('ID скопирован');
        } catch {
            toast.error('Не удалось скопировать');
        }
    }
</script>

<section
    role="group"
    aria-label="Заголовок карточки точки"
    class={cn(
        'relative flex touch-none items-center gap-1 border-b p-3 select-none',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
    )}
    onpointerdown={onDragStart}
    onpointermove={onDragMove}
    onpointerup={onDragEnd}
    onpointercancel={onDragCancel}
>
    <div
        aria-hidden="true"
        class="bg-muted-foreground/25 absolute top-1.5 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full"
    ></div>
    <div class="mr-2 flex min-w-0 flex-1 items-center gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-2">
            {#if initialValues.internalId}
                <button
                    type="button"
                    class={cn(
                        badgeVariants({variant: 'outline'}),
                        'hover:bg-accent hover:text-accent-foreground shrink-0 font-mono text-xs tracking-wider',
                    )}
                    title="Нажмите, чтобы скопировать"
                    onclick={() => copyInternalId(initialValues.internalId ?? '')}
                >
                    {initialValues.internalId}
                </button>
            {/if}
            <div
                class={cn(
                    'grid min-w-0 flex-1 transition-[grid-template-columns,opacity] ease-out',
                    isDragging && 'transition-none',
                    isMinimized ? 'grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0',
                )}
                aria-hidden={!isMinimized}
            >
                <div class="flex min-w-0 items-center gap-2 overflow-hidden">
                    {#if initialValues.category}
                        <CategoryBadge
                            name={initialValues.category.name}
                            categoryId={initialValues.category.id}
                            showName={false}
                            size="sm"
                            class="ml-1.5 shrink-0"
                        />
                    {/if}
                    <span
                        class="text-foreground block min-w-0 flex-1 overflow-hidden text-nowrap text-ellipsis"
                    >
                        {initialValues.name ?? 'Новый маркер'}
                    </span>
                </div>
            </div>
        </div>
    </div>
    <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0" onclick={onTogglePosition}>
        {#if position === 'full'}
            <ChevronDownIcon class="stroke-3" />
        {:else}
            <ChevronUpIcon class="stroke-3" />
        {/if}
    </Button>
    <CloseButton {onRequestClose} />
</section>
