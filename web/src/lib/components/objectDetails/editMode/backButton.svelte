<script lang="ts">
    import CloseConfirmation from '$lib/components/objectDetails/closeConfirmation.svelte';
    import {Button} from '$lib/components/ui/button';

    interface Props {
        isConfirmationRequired?: boolean;
        onClick(): void;
    }

    let {isConfirmationRequired = false, onClick}: Props = $props();
    let isDialogOpen = $state(false);

    function handleClick() {
        if (!isConfirmationRequired) {
            onClick();
            return;
        }

        isDialogOpen = true;
    }
</script>

<Button variant="ghost" onclick={handleClick}>Назад</Button>
<CloseConfirmation bind:isOpen={isDialogOpen} {onClick} />
