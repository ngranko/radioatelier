<script lang="ts">
    import CloseConfirmDialog from '$lib/components/objectDetails/closeConfirmDialog.svelte';
    import {Button} from '$lib/components/ui/button';

    interface Props {
        isConfirmationRequired?: boolean;
        onClick(): void;
    }

    let {isConfirmationRequired = false, onClick}: Props = $props();

    let isConfirmOpen = $state(false);

    function goBack() {
        if (isConfirmationRequired) {
            isConfirmOpen = true;
            return;
        }
        onClick();
    }
</script>

<Button variant="ghost" onclick={goBack}>Назад</Button>
<CloseConfirmDialog bind:open={isConfirmOpen} onConfirmClose={onClick} />
