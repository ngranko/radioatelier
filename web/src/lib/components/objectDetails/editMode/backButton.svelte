<script lang="ts">
    import CloseConfirmation from '$lib/components/objectDetails/closeConfirmation.svelte';
    import TextButton from '$lib/components/button/textButton.svelte';

    let isDialogOpen = false;

    function handleClick() {
        isDialogOpen = true;
    }
</script>

<TextButton type="button" on:click={handleClick}>Назад</TextButton>
<CloseConfirmation bind:isOpen={isDialogOpen} on:click />
