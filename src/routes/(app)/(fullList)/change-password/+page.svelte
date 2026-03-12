<script lang="ts">
    import PasswordChangeDialog from './passwordChangeDialog.svelte';

    let isOpen = $state(true);
</script>

<PasswordChangeDialog bind:isOpen />
