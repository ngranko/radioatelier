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
} from '@lucide/svelte';
import type {Component} from 'svelte';
import {
    MARKER_COLORS,
    MARKER_ICON_KEYS,
    MARKER_ICON_STYLES,
    type MarkerIconKey,
    type MarkerIconStyle,
} from './markerStyling.data';

interface MarkerIcon {
    component: Component;
    style: MarkerIconStyle;
}

export const markerColorMap = MARKER_COLORS;

const ICON_COMPONENTS: Record<MarkerIconKey, Component> = {
    activity: Activity,
    anchor: Anchor,
    antenna: Antenna,
    bookmark: Bookmark,
    cableCar: CableCar,
    cctv: Cctv,
    crown: Crown,
    flag: Flag,
    flame: Flame,
    flask: FlaskConical,
    footprints: Footprints,
    hammer: Hammer,
    heart: Heart,
    hourglass: Hourglass,
    house: House,
    lamp: Lamp,
    landmark: Landmark,
    library: Library,
    lightbulb: Lightbulb,
    martini: Martini,
    milestone: Milestone,
    mountain: Mountain,
    plane: Plane,
    plug: Plug,
    puzzle: Puzzle,
    rocket: Rocket,
    shopping: ShoppingCart,
    trafficCone: TrafficCone,
    wrench: Wrench,
    zap: Zap,
};

export const markerIconMap = Object.fromEntries(
    MARKER_ICON_KEYS.map(key => [
        key,
        {component: ICON_COMPONENTS[key], style: MARKER_ICON_STYLES[key]},
    ]),
) as Record<MarkerIconKey, MarkerIcon>;

export * from './markerStyling.data';
