import {readPopTime} from '$lib/services/map/renderer/clustered/spriteSpawns';
import {type Accessor, type Layer, LayerExtension} from '@deck.gl/core';

/** Matches --animate-popin and --animate-popout, the DOM markers' entrance and exit. */
export const SPRITE_POP_IN_MS = 250;
export const SPRITE_POP_OUT_MS = 150;

// The overshoot of cubic-bezier(0.34, 1.56, 0.64, 1), written as the easeOutBack constant.
const OVERSHOOT = 1.70158;

const popUniforms = {
    name: 'spritePop',
    vs: `layout(std140) uniform spritePopUniforms {
  float now;
  float duration;
} spritePop;
`,
    uniformTypes: {now: 'f32', duration: 'f32'},
} as const;

const GROW = `1.0 + fromEnd * fromEnd * ((${OVERSHOOT} + 1.0) * fromEnd + ${OVERSHOOT})`;
// The reverse of --animate-popout's curve: slow to let go, then quick.
const SHRINK = '1.0 - progress * progress * progress';

function buildPopScaleSource(reverse: boolean): string {
    return `
in float instancePopTimes;

float spritePop_getScale() {
  float elapsed = spritePop.now - instancePopTimes;
  float progress = clamp(elapsed / spritePop.duration, 0.0, 1.0);
  float fromEnd = progress - 1.0;
  return ${reverse ? SHRINK : GROW};
}
`;
}

export interface SpritePopProps<DataT = unknown> {
    /** Milliseconds on the pop timebase: when each sprite entered or left. */
    getPopTime?: Accessor<DataT, number>;
    /** The newest of those, so the layer knows when it can stop animating. */
    latestPop?: number;
}

interface SpritePopOptions {
    /** Shrink to nothing instead of growing from it. */
    reverse?: boolean;
    durationMs?: number;
}

/**
 * Scales a sprite in the vertex shader over the milliseconds after it arrives or leaves. deck.gl's
 * own transitions cannot do either end: a newly added instance is seeded with its final value, so
 * it has nothing to ease from, and a removed one is simply gone. Doing it in the shader keeps the
 * whole animation on the GPU, one attribute wide, however many markers move at once.
 */
export class SpritePopExtension extends LayerExtension<SpritePopOptions> {
    public static extensionName = 'SpritePopExtension';

    public static defaultProps = {
        getPopTime: {type: 'accessor', value: 0},
        latestPop: {type: 'number', value: 0},
    };

    public getShaders(this: Layer, extension: SpritePopExtension) {
        return {
            modules: [popUniforms],
            inject: {
                'vs:#decl': buildPopScaleSource(extension.readOptions().reverse ?? false),
                'vs:DECKGL_FILTER_SIZE': 'size *= spritePop_getScale();',
            },
        };
    }

    public initializeState(this: Layer<SpritePopProps>): void {
        this.getAttributeManager()?.addInstanced({
            instancePopTimes: {size: 1, accessor: 'getPopTime', defaultValue: 0},
        });
    }

    public draw(
        this: Layer<SpritePopProps>,
        _params: unknown,
        extension: SpritePopExtension,
    ): void {
        const duration = extension.readOptions().durationMs ?? SPRITE_POP_IN_MS;
        const now = readPopTime();
        this.setShaderModuleProps({spritePop: {now, duration}});

        // Nothing else drives frames while the map sits still, so the layer asks for its own.
        if (now - (this.props.latestPop ?? 0) < duration) {
            this.setNeedsRedraw();
        }
    }

    // LayerExtension only assigns opts when it is constructed with some.
    private readOptions(): SpritePopOptions {
        return this.opts ?? {};
    }
}
