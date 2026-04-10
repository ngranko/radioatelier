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

export function randomMarkerColor(): MarkerColor {
    return MARKER_COLORS[Math.floor(Math.random() * MARKER_COLORS.length)];
}

export function randomMarkerIconKey(): MarkerIconKey {
    return MARKER_ICON_KEYS[Math.floor(Math.random() * MARKER_ICON_KEYS.length)];
}
