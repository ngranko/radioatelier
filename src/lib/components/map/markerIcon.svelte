<script lang="ts">
    import type {MarkerIcon} from '$lib/interfaces/marker';
    import type {MarkerIconStyle} from '$lib/services/map/markerStyling.data';

    interface Props {
        icon: MarkerIcon;
        iconStyle?: MarkerIconStyle;
        className?: string;
    }

    let {icon, iconStyle = {}, className = ''}: Props = $props();

    const Icon = $derived(icon);
    const markerIconSize = 14;
    // Lucide spreads extra props over its own defaults, so an explicit `fill={undefined}` would
    // strip its `fill="none"` and paint outline icons solid.
    const fillProps = $derived(iconStyle.filled ? {fill: 'currentColor'} : {});
</script>

<Icon
    class={className}
    width={markerIconSize}
    height={markerIconSize}
    strokeWidth={iconStyle.strokeWidth}
    {...fillProps}
/>
