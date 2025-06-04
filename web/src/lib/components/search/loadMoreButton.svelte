<script lang="ts">
    import TextButton from '$lib/components/button/textButton.svelte';

    let {onLoadMoreClick} = $props();
</script>

<button
    class="load-more w-full pb-2 pl-3 pr-3 pt-1 bg-transparent hover:bg-gray-100 border-none rounded-b-lg text-left cursor-pointer transition-colors"
    onclick={onLoadMoreClick}
>
    <TextButton>больше результатов</TextButton>
</button>
