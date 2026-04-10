<script lang="ts">
    import MarkerIcon from '$lib/components/map/markerIcon.svelte';
    import {markerIconMap, type MarkerIconKey} from '$lib/services/map/markerStyling';
    import type {MarkerIcon as MarkerIconType} from '$lib/interfaces/marker';

    interface Props {
        color: string;
        iconKey: MarkerIconKey;
        size?: 'sm' | 'md';
    }

    let {color, iconKey, size = 'md'}: Props = $props();

    const sizeClass = $derived(size === 'sm' ? 'size-7' : 'size-10');
    const iconSizeClass = $derived(size === 'sm' ? 'size-3.5' : 'size-5');
    const icon = $derived(markerIconMap[iconKey]);
</script>

<div
    class="flex shrink-0 items-center justify-center rounded-full shadow-sm transition-all duration-200 {sizeClass}"
    style:background-color={color}
    style:box-shadow="0 0 0 2px white, 0 0 0 4px color-mix(in srgb, {color} 25%, transparent)"
>
    {#if icon}
        <MarkerIcon
            icon={icon.component as MarkerIconType}
            className="{icon.className} {iconSizeClass} text-white"
        />
    {/if}
</div>
