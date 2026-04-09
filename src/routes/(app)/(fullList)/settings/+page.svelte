<script lang="ts">
    import SettingsDialog from '$lib/components/settings/settingsDialog.svelte';

    let isOpen = $state(true);
</script>

<SettingsDialog bind:isOpen />
