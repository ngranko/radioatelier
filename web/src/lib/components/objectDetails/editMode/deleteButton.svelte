<script lang="ts">
    import TextButton from '$lib/components/button/textButton.svelte';
    import Dialog from '$lib/components/dialog.svelte';

    interface Props {
        onClick(): void;
    }

    let {onClick}: Props = $props();

    let isDialogOpen = $state(false);

    function handleDialogOpen() {
        isDialogOpen = true;
    }

    function handleClose() {
        isDialogOpen = false;
    }
</script>

<TextButton type="button" modifier="danger" onClick={handleDialogOpen}>Удалить</TextButton>
<Dialog isOpen={isDialogOpen}>
    <p>Вы действительно хотите удалить точку?</p>
    <div class="actions">
        <TextButton type="button" onClick={handleClose}>Отменить</TextButton>
        <span class="delete">
            <TextButton type="button" modifier="danger" {onClick}>Удалить</TextButton>
        </span>
    </div>
</Dialog>

<style lang="scss">
    .actions {
        display: flex;
        justify-content: flex-end;
    }

    .delete {
        margin-left: 8px;
    }
</style>
