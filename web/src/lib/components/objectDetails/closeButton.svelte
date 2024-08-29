<script lang="ts">
    import CloseConfirmation from '$lib/components/objectDetails/closeConfirmation.svelte';
    import {createEventDispatcher} from 'svelte';
    import {activeObjectInfo} from '$lib/stores/map';

    const dispatch = createEventDispatcher();

    let isDialogOpen = false;

    function handleClick() {
        if ($activeObjectInfo.isEditing) {
            isDialogOpen = true;
        } else {
            dispatch('click');
        }
    }
</script>

<button class="close" on:click={handleClick}>
    <i class="fa-solid fa-xmark"></i>
</button>
<CloseConfirmation bind:isOpen={isDialogOpen} on:click />

<style lang="scss">
    @use '../../../styles/colors';

    .close {
        width: 26px;
        height: 26px;
        border: 0;
        padding: 0;
        margin: 0;
        background: none;
        font-size: 26px;
        cursor: pointer;
        transition: 0.2s;

        &:hover {
            color: colors.$primary;
        }

        & i {
            display: block;
        }
    }
</style>
