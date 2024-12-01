<script lang="ts">
    import Form from '$lib/components/userMenu/import/form.svelte';
    import {createMutation} from '@tanstack/svelte-query';
    import toast from 'svelte-french-toast';
    import {extractPreview} from '$lib/api/import';
    import Svelecte from 'svelecte';
    import type {ImportMappings} from '$lib/interfaces/import';
    import {importInfo} from '$lib/stores/import';

    interface Props {
        onClose(): void;
    }

    let {onClose}: Props = $props();

    const preview = createMutation({mutationFn: extractPreview});

    async function handleSeparatorChange() {
        try {
            const result = await toast.promise(
                $preview.mutateAsync({id: $importInfo.id, separator: $importInfo.separator}),
                {
                    loading: 'Обновляю превью...',
                    error: 'Не удалось обновить превью',
                    success: 'Превью обновлено',
                },
            );
            importInfo.update(value => ({...value, preview: result.data.preview}));
        } catch (error) {
            console.error(error);
        }
    }

    function handleImport(values: ImportMappings) {
        $importInfo.provider.start($importInfo.id, $importInfo.separator, values);
        importInfo.update(value => ({...value, currentStep: 3, status: 'in progress'}));
    }
</script>

<div class="root">
    <h2>Импорт csv</h2>
    <h3>Превью</h3>
    <div class="preview">
        {#each $importInfo.preview as row}
            <div class="row">
                {#each row as cell}
                    <div class="cell">{cell}</div>
                {/each}
            </div>
        {/each}
        <div class="row">
            {#if $importInfo.preview.length > 0}
                {#each $importInfo.preview[0] as _, i}
                    <div class="cell">{i === 0 ? '...' : ''}</div>
                {/each}
            {/if}
        </div>
    </div>
    <div class="changeSeparator">
        <label for="separator" class="separatorLabel">
            Неверное превью? Попробуйте сменить разделитель:
        </label>
        <Svelecte
            bind:value={$importInfo.separator}
            inputId="separator"
            on:change={handleSeparatorChange}
            options={[
                {value: ';', text: ';'},
                {value: ',', text: ','},
                {value: '|', text: '|'},
                {value: '\t', text: 'Tab'},
            ]}
            class="importSeparatorSelect"
        />
    </div>
    <h3>Импортировать колонки</h3>
    <Form {onClose} onSubmit={handleImport} />
</div>

<style lang="scss">
    @use '../../../../styles/colors';
    @use '../../../../styles/typography';

    .root {
        width: 100%;
        max-width: 600px;
        margin-bottom: -24px;
    }

    .preview {
        @include typography.size-14;
        margin: 0 -24px;
        margin-bottom: 16px;
        padding: 0 24px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }

    .row {
        display: table-row;
    }

    .cell {
        max-width: 160px;
        display: table-cell;
        padding: 8px 16px;
        border: 1px solid colors.$lightgray;
        text-overflow: ellipsis;
        text-wrap: nowrap;
        overflow: hidden;
    }

    .changeSeparator {
        @include typography.size-14;
    }

    .separatorLabel {
        margin-right: 8px;
    }

    :global(.importSeparatorSelect) {
        display: inline-block;
        border-color: colors.$gray;
    }
</style>
