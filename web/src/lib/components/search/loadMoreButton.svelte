<script lang="ts">
    import TextButton from '$lib/components/button/textButton.svelte';

    let {onLoadMoreClick} = $props();
</script>

<button
    class="load-more w-full p-2 pt-1 bg-transparent hover:bg-gray-100 border-none text-left cursor-pointer transition-colors"
    onclick={onLoadMoreClick}
>
    <TextButton>Больше результатов</TextButton>
</button>
