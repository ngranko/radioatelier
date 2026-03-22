<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import XMarkIcon from '@lucide/svelte/icons/x';

    let {onClick} = $props();
</script>

<Button
    variant="ghost"
    size="icon"
    class="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full transition-colors"
    aria-label="Очистить"
    onclick={onClick}
>
    <XMarkIcon class="stroke-3" />
</Button>
