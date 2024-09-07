<script lang="ts">
    import {importInfo} from '$lib/stores/import';
    import {createEventDispatcher} from 'svelte';
    import TextButton from '$lib/components/button/textButton.svelte';

    const dispatch = createEventDispatcher();

    function handleClose() {
        dispatch('close');
    }
</script>

<div class="root">
    {#if $importInfo.status === 'in progress'}
        <h2>Подождите, импортирую точки</h2>
        <div class="percentage">{$importInfo.percentage}%</div>
        <TextButton on:click={handleClose}>Отменить</TextButton>
    {:else if $importInfo.status === 'success'}
        <h2>Импорт завершен!</h2>
        <div>{$importInfo.resultText}</div>
        {#if $importInfo.rowErrors.length > 0}
            <h3>Ошибки:</h3>
            {#each $importInfo.rowErrors as error}<div>{error}</div>{/each}
        {/if}
        <div class="actions">
            <TextButton on:click={handleClose}>Импортировать другой файл</TextButton>
            <TextButton on:click={handleClose}>Закрыть</TextButton>
        </div>
    {:else if $importInfo.status === 'error'}
        <h2>Во время импорта произошла ошибка</h2>
        <div>{$importInfo.globalError}</div>
        <div class="actions">
            <TextButton on:click={handleClose}>Импортировать другой файл</TextButton>
            <TextButton on:click={handleClose}>Закрыть</TextButton>
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

    .actions {
        margin-top: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
    }
</style>
