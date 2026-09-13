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

// The DOM glyph renders these classes and the sprite atlas reads its stroke and fill from them, so a
// marker promoted from a sprite to a DOM element keeps its exact look.
export const MARKER_ICON_CLASSES: Record<MarkerIconKey, string> = {
    activity: 'stroke-3',
    anchor: 'stroke-3',
    antenna: 'stroke-3',
    bookmark: 'fill-current stroke-1',
    cableCar: 'fill-current',
    cctv: 'fill-current stroke-[1.5]',
    crown: 'fill-current',
    flag: 'fill-current',
    flame: 'fill-current stroke-1',
    flask: 'fill-current stroke-[1.5]',
    footprints: 'fill-current stroke-1',
    hammer: 'fill-current stroke-1',
    heart: 'fill-current stroke-1',
    hourglass: 'fill-current stroke-[1.5]',
    house: 'stroke-3',
    lamp: 'fill-current stroke-[1.5]',
    landmark: 'fill-current stroke-[2.5]',
    library: 'fill-current stroke-3',
    lightbulb: 'fill-current',
    martini: 'fill-current stroke-[2.5]',
    milestone: 'fill-current stroke-[2.5]',
    mountain: 'fill-current stroke-1',
    plane: 'fill-current stroke-1',
    plug: 'fill-current stroke-[2.5]',
    puzzle: 'fill-current stroke-1',
    rocket: 'fill-current stroke-1',
    shopping: 'fill-current stroke-[1.5]',
    trafficCone: 'stroke-3',
    wrench: 'fill-current stroke-1',
    zap: 'fill-current stroke-1',
};

export function randomMarkerColor(): MarkerColor {
    return MARKER_COLORS[Math.floor(Math.random() * MARKER_COLORS.length)];
}

export function randomMarkerIconKey(): MarkerIconKey {
    return MARKER_ICON_KEYS[Math.floor(Math.random() * MARKER_ICON_KEYS.length)];
}
