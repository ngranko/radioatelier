<script lang="ts">
    import {Button} from '$lib/components/ui/button';

    let {onClick} = $props();
</script>

<Button
    variant="ghost"
    size="icon"
    class="h-10 w-10 rounded-full text-xl"
    aria-label="Очистить"
    onclick={onClick}
>
    <i class="fa-solid fa-xmark block w-5"></i>
</Button>
