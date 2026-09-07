<script lang="ts">
    import TaxonomyDialog from '$lib/components/admin/taxonomyDialog.svelte';

    let isOpen = $state(true);
</script>

<TaxonomyDialog bind:isOpen />
