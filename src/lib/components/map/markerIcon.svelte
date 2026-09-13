<script lang="ts">
    import type {MarkerIcon} from '$lib/interfaces/marker';
    import {cn} from '$lib/utils';

    interface Props {
        icon: MarkerIcon;
        className?: string;
    }

    let {icon, className = ''}: Props = $props();

    const Icon = $derived(icon);
</script>

<Icon class={cn('size-3.5', className)} />
