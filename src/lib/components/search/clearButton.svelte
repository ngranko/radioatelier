<script lang="ts">
    import {Button} from '$lib/components/ui/button';

    let {onClick} = $props();
</script>

<Button
    variant="ghost"
    size="icon"
    class="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full transition-colors"
    aria-label="Очистить"
    onclick={onClick}
>
    <i class="fa-solid fa-xmark block w-4 text-sm"></i>
</Button>
