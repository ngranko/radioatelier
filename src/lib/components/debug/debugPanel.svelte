<script lang="ts">
    import {goto} from '$app/navigation';
    import ProfileResult from '$lib/components/debug/profileResult.svelte';
    import {Button} from '$lib/components/ui/button';
    import {Checkbox} from '$lib/components/ui/checkbox';
    import {Input} from '$lib/components/ui/input';
    import {Label} from '$lib/components/ui/label';
    import {addDebugMarkers, removeDebugMarkers} from '$lib/services/debug/debugMarkerActions';
    import {
        clampMarkerCount,
        DEBUG_MARKER_MAX,
        DEBUG_MARKER_MIN,
    } from '$lib/services/debug/markerCount';
    import {
        isMarkerClusteringEnabled,
        setMarkerClusteringEnabled,
    } from '$lib/services/map/markerClustering';
    import {debugMarkerState} from '$lib/state/debugMarkers.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import ActivityIcon from '@lucide/svelte/icons/activity';
    import XIcon from '@lucide/svelte/icons/x';

    let countText = $state(String(debugMarkerState.count));
    let clusteringEnabled = $state(isMarkerClusteringEnabled());

    const placedCount = $derived(debugMarkerState.items.length);
    const isRunning = $derived(debugMarkerState.runningOperation !== null);
    const canAdd = $derived(mapState.isReady && !isRunning && placedCount === 0);
    const canRemove = $derived(mapState.isReady && !isRunning && placedCount > 0);

    function commitCount() {
        debugMarkerState.count = clampMarkerCount(Number(countText));
        countText = String(debugMarkerState.count);
    }

    async function handleAdd() {
        commitCount();
        await addDebugMarkers();
    }

    async function handleRemove() {
        await removeDebugMarkers();
    }

    function handleClose() {
        goto('/');
    }

    function handleClusteringChange(checked: boolean | 'indeterminate') {
        clusteringEnabled = Boolean(checked);
        setMarkerClusteringEnabled(clusteringEnabled);
    }
</script>

<div
    class="bg-background/95 absolute bottom-4 left-4 z-4 flex max-h-[min(70vh,36rem)] w-[min(100%-2rem,20rem)] flex-col overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/[0.08] backdrop-blur-sm dark:ring-white/[0.12]"
>
    <div class="flex shrink-0 items-start gap-3 px-4 pt-4 pb-3">
        <div
            class="bg-primary/10 ring-primary/20 flex size-9 shrink-0 items-center justify-center rounded-xl ring-1"
        >
            <ActivityIcon class="text-primary size-4" />
        </div>
        <div class="min-w-0 grow">
            <h2 class="text-sm font-semibold tracking-[-0.01em]">Профилирование маркеров</h2>
            <p class="text-muted-foreground mt-0.5 text-xs leading-snug">
                Тестовые маркеры не сохраняются в базу
            </p>
        </div>
        <button
            type="button"
            class="hover:bg-muted shrink-0 rounded-full p-1"
            onclick={handleClose}
            aria-label="Закрыть"
        >
            <XIcon class="text-muted-foreground size-4" />
        </button>
    </div>

    <div class="min-h-0 grow space-y-3 overflow-y-auto px-4 pb-4">
        <div class="space-y-1.5">
            <Label for="debug-marker-count">Количество</Label>
            <Input
                id="debug-marker-count"
                type="number"
                min={DEBUG_MARKER_MIN}
                max={DEBUG_MARKER_MAX}
                step="1"
                bind:value={countText}
                onblur={commitCount}
                disabled={isRunning}
            />
        </div>

        <p class="text-muted-foreground text-xs">На карте: {placedCount}</p>

        {#if mapState.markerManager?.isClusteredRenderer}
            <label class="flex cursor-pointer items-center justify-between gap-3 select-none">
                <span class="text-sm">Кластеризация</span>
                <Checkbox
                    checked={clusteringEnabled}
                    onCheckedChange={handleClusteringChange}
                    disabled={isRunning}
                />
            </label>
        {/if}

        <div class="flex gap-2">
            <Button
                class="grow"
                size="sm"
                disabled={!canAdd}
                loading={debugMarkerState.runningOperation === 'add'}
                onclick={handleAdd}
            >
                Добавить
            </Button>
            <Button
                class="grow"
                size="sm"
                variant="outline"
                disabled={!canRemove}
                loading={debugMarkerState.runningOperation === 'remove'}
                onclick={handleRemove}
            >
                Удалить
            </Button>
        </div>

        {#if debugMarkerState.lastResult}
            <ProfileResult result={debugMarkerState.lastResult} />
        {/if}
    </div>
</div>
