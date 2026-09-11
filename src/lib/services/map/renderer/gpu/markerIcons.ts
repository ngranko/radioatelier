import {
    MARKER_ICON_KEYS,
    MARKER_ICON_STYLES,
    type MarkerIconKey,
    type MarkerIconStyle,
} from '$lib/services/map/markerStyling.data';
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

const ICON_SVGS: Record<MarkerIconKey, string> = {
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

export const GLYPH_VIEWBOX_SIZE = 24;

/** White 24x24 SVG markup per icon, embedded into the composed marker sprites. */
export const MARKER_GLYPHS = Object.fromEntries(
    MARKER_ICON_KEYS.map(key => [key, whiteGlyph(ICON_SVGS[key], MARKER_ICON_STYLES[key])]),
) as Record<MarkerIconKey, string>;

function whiteGlyph(svg: string, style: MarkerIconStyle): string {
    return (
        svg
            .replace('stroke="currentColor"', 'stroke="white"')
            .replace('stroke-width="2"', `stroke-width="${style.strokeWidth ?? 2}"`)
            .replace('fill="none"', style.filled ? 'fill="white"' : 'fill="none"')
            // lucide-static ships pretty-printed markup; every newline costs three bytes once the
            // sprite is percent-encoded into a data URL.
            .replace(/\s*\n\s*/g, ' ')
            .trim()
    );
}
