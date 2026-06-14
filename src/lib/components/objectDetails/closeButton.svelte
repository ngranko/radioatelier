<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import XMarkIcon from '@lucide/svelte/icons/x';

    interface Props {
        onRequestClose(): void;
    }

    let {onRequestClose}: Props = $props();
</script>

<Button variant="ghost" size="icon" class="h-8 w-8" onclick={onRequestClose}>
    <XMarkIcon class="stroke-3" />
</Button>
