<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import XIcon from '@lucide/svelte/icons/x';

    interface Props {
        onClick(e: MouseEvent): void;
    }

    let {onClick}: Props = $props();
</script>

<Button variant="ghost" size="icon" onclick={onClick} class="hover:bg-accent rounded-sm p-0.5" aria-label="Clear">
    <XIcon class="size-4" />
</Button>
