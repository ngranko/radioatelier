<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

    let {onLoadMoreClick} = $props();
</script>

<Button
    variant="ghost"
    class="text-primary hover:text-primary/80 group w-full text-xs font-medium"
    onclick={onLoadMoreClick}
>
    Все результаты
    <ChevronDownIcon class="size-3.5 translate-y-0.5 transition-transform" />
</Button>
