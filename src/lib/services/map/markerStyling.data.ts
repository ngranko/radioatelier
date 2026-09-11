export const MARKER_COLORS = [
    'oklch(0 0 0)',
    'oklch(0.60 0.24 18)',
    'oklch(0.73 0.22 45)',
    'oklch(0.72 0.22 95)',
    'oklch(0.65 0.27 145)',
    'oklch(0.72 0.18 210)',
    'oklch(0.55 0.20 258)',
    'oklch(0.53 0.24 310)',
    'oklch(0.65 0.27 340)',
] as const;

export type MarkerColor = (typeof MARKER_COLORS)[number];

export const MARKER_ICON_KEYS = [
    'activity',
    'anchor',
    'antenna',
    'bookmark',
    'cableCar',
    'cctv',
    'crown',
    'flag',
    'flame',
    'flask',
    'footprints',
    'hammer',
    'heart',
    'hourglass',
    'house',
    'lamp',
    'landmark',
    'library',
    'lightbulb',
    'martini',
    'milestone',
    'mountain',
    'plane',
    'plug',
    'puzzle',
    'rocket',
    'shopping',
    'trafficCone',
    'wrench',
    'zap',
] as const;

export type MarkerIconKey = (typeof MARKER_ICON_KEYS)[number];

export interface MarkerIconStyle {
    filled?: boolean;
    strokeWidth?: number;
}

// The sprite atlas and the DOM glyph both draw from this table, so a marker promoted from a sprite
// to a DOM element keeps its exact look.
export const MARKER_ICON_STYLES: Record<MarkerIconKey, MarkerIconStyle> = {
    activity: {strokeWidth: 3},
    anchor: {strokeWidth: 3},
    antenna: {strokeWidth: 3},
    bookmark: {filled: true, strokeWidth: 1},
    cableCar: {filled: true},
    cctv: {filled: true, strokeWidth: 1.5},
    crown: {filled: true},
    flag: {filled: true},
    flame: {filled: true, strokeWidth: 1},
    flask: {filled: true, strokeWidth: 1.5},
    footprints: {filled: true, strokeWidth: 1},
    hammer: {filled: true, strokeWidth: 1},
    heart: {filled: true, strokeWidth: 1},
    hourglass: {filled: true, strokeWidth: 1.5},
    house: {strokeWidth: 3},
    lamp: {filled: true, strokeWidth: 1.5},
    landmark: {filled: true, strokeWidth: 2.5},
    library: {filled: true, strokeWidth: 3},
    lightbulb: {filled: true},
    martini: {filled: true, strokeWidth: 2.5},
    milestone: {filled: true, strokeWidth: 2.5},
    mountain: {filled: true, strokeWidth: 1},
    plane: {filled: true, strokeWidth: 1},
    plug: {filled: true, strokeWidth: 2.5},
    puzzle: {filled: true, strokeWidth: 1},
    rocket: {filled: true, strokeWidth: 1},
    shopping: {filled: true, strokeWidth: 1.5},
    trafficCone: {strokeWidth: 3},
    wrench: {filled: true, strokeWidth: 1},
    zap: {filled: true, strokeWidth: 1},
};

export function randomMarkerColor(): MarkerColor {
    return MARKER_COLORS[Math.floor(Math.random() * MARKER_COLORS.length)];
}

export function randomMarkerIconKey(): MarkerIconKey {
    return MARKER_ICON_KEYS[Math.floor(Math.random() * MARKER_ICON_KEYS.length)];
}
