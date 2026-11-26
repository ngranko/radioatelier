<script lang="ts">
    import ReviewDialog from '$lib/components/review/reviewDialog.svelte';

    let isOpen = $state(true);
</script>

<ReviewDialog bind:isOpen />
