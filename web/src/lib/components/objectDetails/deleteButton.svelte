<script lang="ts">
    import TextButton from '$lib/components/button/textButton.svelte';

    let dialog: HTMLDialogElement;

    function handleDialogOpen() {
        dialog.showModal();
    }

    function handleClose() {
        dialog.close();
    }
</script>

<TextButton type="button" modifier="danger" on:click={handleDialogOpen}>Удалить</TextButton>
<dialog bind:this={dialog} class="dialog">
    <p>Вы действительно хотите удалить точку?</p>
    <div class="actions">
        <TextButton type="button" on:click={handleClose}>Отменить</TextButton>
        <span class="delete">
            <TextButton type="button" modifier="danger" on:click>Удалить</TextButton>
        </span>
    </div>
</dialog>

<style lang="scss">
    .dialog {
        border: 0;
        border-radius: 8px;
        opacity: 0;
        transition: 0.2s ease-out allow-discrete;

        &[open] {
            opacity: 1;
        }

        &::backdrop {
            background-color: rgb(0 0 0 / 0%);
            transition: 0.2s ease-out allow-discrete;
        }

        &[open]::backdrop {
            background-color: rgb(0 0 0 / 25%);
        }
    }

    // will be supported in svelte 5
    @starting-style {
        .dialog[open] {
            opacity: 0;
        }

        .dialog[open]::backdrop {
            background-color: rgb(0 0 0 / 0%);
        }
    }

    .actions {
        display: flex;
        justify-content: flex-end;
    }

    .delete {
        margin-left: 8px;
    }
</style>
