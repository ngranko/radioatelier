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

import {MARKER_COLORS, type MarkerIconKey} from './markerStyling.data';

interface MarkerIcon {
    component: Component;
    className: string;
}

export const markerColorMap = MARKER_COLORS;

export const markerIconMap: Record<MarkerIconKey, MarkerIcon> = {
    activity: {
        component: Activity,
        className: 'stroke-3',
    },
    anchor: {
        component: Anchor,
        className: 'stroke-3',
    },
    antenna: {
        component: Antenna,
        className: 'stroke-3',
    },
    bookmark: {
        component: Bookmark,
        className: 'fill-current stroke-1',
    },
    cableCar: {
        component: CableCar,
        className: 'fill-current',
    },
    cctv: {
        component: Cctv,
        className: 'fill-current stroke-1.5',
    },
    crown: {
        component: Crown,
        className: 'fill-current',
    },
    flag: {
        component: Flag,
        className: 'fill-current',
    },
    flame: {
        component: Flame,
        className: 'fill-current stroke-1',
    },
    flask: {
        component: FlaskConical,
        className: 'fill-current stroke-1.5',
    },
    footprints: {
        component: Footprints,
        className: 'fill-current stroke-1',
    },
    hammer: {
        component: Hammer,
        className: 'fill-current stroke-1',
    },
    heart: {
        component: Heart,
        className: 'fill-current stroke-1',
    },
    hourglass: {
        component: Hourglass,
        className: 'fill-current stroke-1.5',
    },
    house: {
        component: House,
        className: 'stroke-3',
    },
    lamp: {
        component: Lamp,
        className: 'fill-current stroke-1.5',
    },
    landmark: {
        component: Landmark,
        className: 'fill-current stroke-2.5',
    },
    library: {
        component: Library,
        className: 'fill-current stroke-3',
    },
    lightbulb: {
        component: Lightbulb,
        className: 'fill-current',
    },
    martini: {
        component: Martini,
        className: 'fill-current stroke-2.5',
    },
    milestone: {
        component: Milestone,
        className: 'fill-current stroke-2.5',
    },
    mountain: {
        component: Mountain,
        className: 'fill-current stroke-1',
    },
    plane: {
        component: Plane,
        className: 'fill-current stroke-1',
    },
    plug: {
        component: Plug,
        className: 'fill-current stroke-2.5',
    },
    puzzle: {
        component: Puzzle,
        className: 'fill-current stroke-1',
    },
    rocket: {
        component: Rocket,
        className: 'fill-current stroke-1',
    },
    shopping: {
        component: ShoppingCart,
        className: 'fill-current stroke-1.5',
    },
    trafficCone: {
        component: TrafficCone,
        className: 'stroke-3',
    },
    wrench: {
        component: Wrench,
        className: 'fill-current stroke-1',
    },
    zap: {
        component: Zap,
        className: 'fill-current stroke-1',
    },
} as const;

export * from './markerStyling.data';
