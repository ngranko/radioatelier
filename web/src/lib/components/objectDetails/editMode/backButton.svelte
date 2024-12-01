<script lang="ts">
    import CloseConfirmation from '$lib/components/objectDetails/closeConfirmation.svelte';
    import TextButton from '$lib/components/button/textButton.svelte';

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

<TextButton type="button" onClick={handleClick}>Назад</TextButton>
<CloseConfirmation bind:isOpen={isDialogOpen} {onClick} />
