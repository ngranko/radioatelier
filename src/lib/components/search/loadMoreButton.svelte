<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

    let {onLoadMoreClick} = $props();
</script>

<Button
    variant="ghost"
    class="text-primary hover:text-primary/80 group w-full text-sm font-medium"
    onclick={onLoadMoreClick}
>
    Все результаты
    <ChevronDownIcon class="size-4 translate-y-px transition-transform" />
</Button>
