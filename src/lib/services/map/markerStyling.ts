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
    MARKER_ICON_CLASSES,
    MARKER_ICON_KEYS,
    type MarkerIconKey,
} from './markerStyling.data';

interface MarkerIcon {
    component: Component;
    class: string;
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
        {component: ICON_COMPONENTS[key], class: MARKER_ICON_CLASSES[key]},
    ]),
) as Record<MarkerIconKey, MarkerIcon>;

export * from './markerStyling.data';
