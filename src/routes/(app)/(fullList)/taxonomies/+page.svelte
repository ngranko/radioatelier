<script lang="ts">
    import TaxonomyDialog from '$lib/components/taxonomies/taxonomyDialog.svelte';

    let isOpen = $state(true);
</script>

<TaxonomyDialog bind:isOpen />
