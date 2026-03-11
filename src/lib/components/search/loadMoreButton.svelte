<script lang="ts">
    import {Button} from '$lib/components/ui/button';

    let {onLoadMoreClick} = $props();
</script>

<Button
    variant="ghost"
    class="text-primary hover:text-primary/80 group w-full text-xs font-medium"
    onclick={onLoadMoreClick}
>
    Все результаты
    <i
        class="fa-solid fa-chevron-down text-[10px] transition-transform group-hover:translate-y-0.5"
    ></i>
</Button>
