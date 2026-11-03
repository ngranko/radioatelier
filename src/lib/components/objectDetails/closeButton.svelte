<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import XMarkIcon from '@lucide/svelte/icons/x';

    interface Props {
        onRequestClose(): void;
    }

    let {onRequestClose}: Props = $props();
</script>

<Button
    variant="ghost"
    size="icon"
    class="size-8"
    onclick={onRequestClose}
    aria-label="Закрыть карточку точки"
    title="Закрыть карточку точки"
>
    <XMarkIcon class="stroke-3" />
</Button>
