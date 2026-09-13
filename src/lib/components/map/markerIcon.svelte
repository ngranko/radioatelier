<script module lang="ts">
    import type {MarkerStrokeWidth} from '$lib/services/map/markerStyling.data';

    // Tailwind only emits classes it can read as literals, so every allowed width is spelled out
    // instead of interpolated into `stroke-[…]`.
    const STROKE_CLASSES: Record<MarkerStrokeWidth, string> = {
        1: 'stroke-1',
        1.5: 'stroke-[1.5]',
        2: 'stroke-2',
        2.5: 'stroke-[2.5]',
        3: 'stroke-3',
    };
</script>

<script lang="ts">
    import type {MarkerIcon} from '$lib/interfaces/marker';
    import type {MarkerIconStyle} from '$lib/services/map/markerStyling.data';
    import {cn} from '$lib/utils';

    interface Props {
        icon: MarkerIcon;
        iconStyle?: MarkerIconStyle;
        class?: string;
    }

    let {icon, iconStyle = {}, class: className = ''}: Props = $props();

    const Icon = $derived(icon);
    // Classes beat the presentation attributes Lucide renders, so the glyph never needs props.
    const classes = $derived(
        cn(
            'size-3.5',
            STROKE_CLASSES[iconStyle.strokeWidth ?? 2],
            iconStyle.filled ? 'fill-current' : 'fill-none',
            className,
        ),
    );
</script>

<Icon class={classes} />
