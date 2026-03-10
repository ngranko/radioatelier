<script lang="ts">
    import ImportDialog from '$lib/components/userMenu/importDialog.svelte';

    let isOpen = $state(true);
</script>

<ImportDialog bind:isOpen />
