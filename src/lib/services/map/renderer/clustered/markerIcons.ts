import type {MarkerIconKey} from '$lib/services/map/markerStyling.data';
import {
    Activity,
    Anchor,
    Antenna,
    Bookmark,
    CableCar,
    Cctv,
    Crown,
    Flag,
    Flame,
    FlaskConical,
    Footprints,
    Hammer,
    Heart,
    Hourglass,
    House,
    Lamp,
    Landmark,
    Library,
    Lightbulb,
    Martini,
    Milestone,
    Mountain,
    Plane,
    Plug,
    Puzzle,
    Rocket,
    ShoppingCart,
    TrafficCone,
    Wrench,
    Zap,
} from 'lucide-static';

interface IconStyle {
    svg: string;
    filled?: boolean;
    strokeWidth?: number;
}

export interface MarkerIconDefinition {
    id: MarkerIconKey;
    url: string;
    width: number;
    height: number;
    mask: true;
}

const ICON_STYLES: Record<MarkerIconKey, IconStyle> = {
    activity: {svg: Activity, strokeWidth: 3},
    anchor: {svg: Anchor, strokeWidth: 3},
    antenna: {svg: Antenna, strokeWidth: 3},
    bookmark: {svg: Bookmark, filled: true, strokeWidth: 1},
    cableCar: {svg: CableCar, filled: true},
    cctv: {svg: Cctv, filled: true, strokeWidth: 1.5},
    crown: {svg: Crown, filled: true},
    flag: {svg: Flag, filled: true},
    flame: {svg: Flame, filled: true, strokeWidth: 1},
    flask: {svg: FlaskConical, filled: true, strokeWidth: 1.5},
    footprints: {svg: Footprints, filled: true, strokeWidth: 1},
    hammer: {svg: Hammer, filled: true, strokeWidth: 1},
    heart: {svg: Heart, filled: true, strokeWidth: 1},
    hourglass: {svg: Hourglass, filled: true, strokeWidth: 1.5},
    house: {svg: House, strokeWidth: 3},
    lamp: {svg: Lamp, filled: true, strokeWidth: 1.5},
    landmark: {svg: Landmark, filled: true, strokeWidth: 2.5},
    library: {svg: Library, filled: true, strokeWidth: 3},
    lightbulb: {svg: Lightbulb, filled: true},
    martini: {svg: Martini, filled: true, strokeWidth: 2.5},
    milestone: {svg: Milestone, filled: true, strokeWidth: 2.5},
    mountain: {svg: Mountain, filled: true, strokeWidth: 1},
    plane: {svg: Plane, filled: true, strokeWidth: 1},
    plug: {svg: Plug, filled: true, strokeWidth: 2.5},
    puzzle: {svg: Puzzle, filled: true, strokeWidth: 1},
    rocket: {svg: Rocket, filled: true, strokeWidth: 1},
    shopping: {svg: ShoppingCart, filled: true, strokeWidth: 1.5},
    trafficCone: {svg: TrafficCone, strokeWidth: 3},
    wrench: {svg: Wrench, filled: true, strokeWidth: 1},
    zap: {svg: Zap, filled: true, strokeWidth: 1},
};

export const MARKER_ICON_DEFINITIONS = Object.fromEntries(
    Object.entries(ICON_STYLES).map(([key, style]) => [
        key,
        createDefinition(key as MarkerIconKey, style),
    ]),
) as Record<MarkerIconKey, MarkerIconDefinition>;

function createDefinition(key: MarkerIconKey, style: IconStyle): MarkerIconDefinition {
    const svg = style.svg
        .replace('stroke="currentColor"', 'stroke="white"')
        .replace('stroke-width="2"', `stroke-width="${style.strokeWidth ?? 2}"`)
        .replace('fill="none"', style.filled ? 'fill="white"' : 'fill="none"');

    return {
        id: key,
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        width: 24,
        height: 24,
        mask: true,
    };
}
