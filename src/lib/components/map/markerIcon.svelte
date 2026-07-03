<script lang="ts">
    import type {MarkerIcon} from '$lib/interfaces/marker';

    interface Props {
        icon: MarkerIcon;
        className?: string;
    }

    let {icon, className = ''}: Props = $props();

    const Icon = $derived(icon);
    const markerIconSize = 14;
</script>

<Icon class={className} width={markerIconSize} height={markerIconSize} />
