<script lang="ts">
    import {importInfo} from '$lib/stores/import';
    import TextButton from '$lib/components/button/textButton.svelte';

    interface Props {
        onClose(): void;
    }

    let {onClose}: Props = $props();

    function handleReset(event: Event) {
        event.stopPropagation();
        importInfo.reset();
    }
</script>

<div class="root">
    {#if $importInfo.status === 'in progress'}
        <h2>Подождите, импортирую точки</h2>
        <div class="percentage">{$importInfo.percentage}%</div>
        <TextButton onClick={onClose}>Отменить</TextButton>
    {:else if $importInfo.status === 'success'}
        <h2>Импорт завершен!</h2>
        <div>{$importInfo.resultText}</div>
        {#if $importInfo.lineFeedback.length > 0}
            <h3>Ошибки:</h3>
            {#each $importInfo.lineFeedback as item}
                {#if item.severity === 'warning'}
                    <div class="warningFeedback">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        {item.text}
                    </div>
                {:else}
                    <div class="errorFeedback">
                        <i class="fa-solid fa-circle-xmark"></i>
                        {item.text}
                    </div>
                {/if}
            {/each}
        {/if}
        <div class="actions">
            <TextButton onClick={handleReset}>Импортировать другой файл</TextButton>
            <TextButton onClick={onClose}>Закрыть</TextButton>
        </div>
    {:else if $importInfo.status === 'error'}
        <h2>Во время импорта произошла ошибка</h2>
        <div>{$importInfo.globalError}</div>
        <div class="actions">
            <TextButton onClick={handleReset}>Импортировать другой файл</TextButton>
            <TextButton onClick={onClose}>Закрыть</TextButton>
        </div>
    {/if}
</div>

<style lang="scss">
    @use '../../../../styles/colors';
    @use '../../../../styles/typography';

    .root {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .percentage {
        @include typography.size-32;
        @include typography.weight-bold;
        margin-bottom: 24px;
    }

    .warningFeedback {
        & i {
            color: colors.$secondary;
        }
    }

    .errorFeedback {
        & i {
            color: colors.$danger;
        }
    }

    .actions {
        margin-top: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
    }
</style>
