<script lang="ts">
    import LoadChart from '$lib/components/debug/loadChart.svelte';
    import {
        formatAxisNumber,
        formatCpu,
        formatFps,
        formatMb,
        formatMs,
    } from '$lib/services/debug/chartFormat';
    import type {ProfileResult} from '$lib/services/debug/profileMarkerOperation';

    interface Props {
        result: ProfileResult;
    }

    let {result}: Props = $props();

    const operationLabel = $derived(result.operation === 'add' ? 'Добавление' : 'Удаление');
    const rendererLabel = $derived(
        result.renderer === 'clustered'
            ? 'Deck.gl clusters'
            : result.renderer === 'deck'
              ? 'Deck.gl'
              : 'DOM',
    );
    const frameBudgetMs = 1000 / 60;
</script>

<div class="space-y-3">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
        <p class="text-sm font-medium">
            {operationLabel}: {Math.round(result.durationMs)} мс
        </p>
        <p class="text-muted-foreground text-xs">
            {result.markerCount} шт · {rendererLabel}
        </p>
    </div>
    {#if result.timedOut}
        <p class="text-destructive text-xs">Замер остановлен по таймауту</p>
    {/if}
    <LoadChart
        label="Время кадра"
        unit="мс"
        samples={result.samples}
        read={sample => sample.frameMs}
        emptyHint="Нет данных о кадрах"
        formatValue={formatMs}
        formatDetail={formatFps}
        reference={{value: frameBudgetMs, label: '16.7 мс ≈ 60 FPS'}}
        legend={['Выше пунктира — просадки основного потока']}
    />
    <LoadChart
        label="Память JS"
        unit="МБ"
        samples={result.samples}
        read={sample => sample.heapUsedMb}
        emptyHint="Недоступно в этом браузере"
        formatValue={formatMb}
    />
    <LoadChart
        label="Нагрузка CPU"
        unit="0–3"
        samples={result.samples}
        read={sample => sample.cpuPressure}
        emptyHint="Недоступно в этом браузере"
        formatValue={formatCpu}
        formatAxis={formatAxisNumber}
        yMax={3}
        legend={['0 штатная · 1 заметная · 2 высокая · 3 критическая']}
    />
    <p class="text-muted-foreground/80 text-[11px] leading-snug">
        Браузер не отдаёт системные CPU/RAM. Графики показывают нагрузку вкладки: время кадра, кучу
        JS и Compute Pressure, если API доступны.
    </p>
</div>
