<script lang="ts">
    import ImportDialog from '$lib/components/userMenu/importDialog.svelte';

    let isImportDialogOpen = $state(true);
</script>

<ImportDialog bind:isOpen={isImportDialogOpen} />
