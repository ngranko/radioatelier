<script lang="ts">
    import {Button} from '$lib/components/ui/button';

    let {onLoadMoreClick} = $props();
</script>

<Button
    variant="ghost"
    class="text-primary hover:text-primary/90 block w-full rounded-b-lg pt-1 pr-3 pb-2 pl-3 text-left"
    onclick={onLoadMoreClick}
>
    больше результатов
</Button>
