<script lang="ts">
    import CloseConfirmation from '$lib/components/objectDetails/closeConfirmation.svelte';
    import TextButton from '$lib/components/button/textButton.svelte';
    import {createEventDispatcher} from 'svelte';

    const dispatch = createEventDispatcher();

    export let isConfirmationRequired = false;
    let isDialogOpen = false;

    function handleClick() {
        if (!isConfirmationRequired) {
            dispatch('click');
            return;
        }

        isDialogOpen = true;
    }
</script>

<TextButton type="button" on:click={handleClick}>Назад</TextButton>
<CloseConfirmation bind:isOpen={isDialogOpen} on:click />
