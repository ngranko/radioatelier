import {popClock} from '$lib/services/map/renderer/clustered/spriteSpawns';
import {type Accessor, type Layer, LayerExtension} from '@deck.gl/core';

/** Matches --animate-popin, the DOM markers' entrance. */
export const SPRITE_POP_MS = 250;

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

const declaration = `
in float instanceSpawnTimes;

float spritePop_scale() {
  float elapsed = spritePop.now - instanceSpawnTimes;
  float progress = clamp(elapsed / spritePop.duration, 0.0, 1.0);
  float fromEnd = progress - 1.0;
  return 1.0 + fromEnd * fromEnd * ((${OVERSHOOT} + 1.0) * fromEnd + ${OVERSHOOT});
}
`;

export interface SpritePopProps<DataT = unknown> {
    /** Milliseconds on the popClock() timebase, one per marker. */
    getSpawnTime?: Accessor<DataT, number>;
    /** The newest stamp in the data, so the layer knows when it can stop animating. */
    latestSpawn?: number;
}

/**
 * Grows a sprite from nothing when it first joins the layer. deck.gl's own transitions cannot do
 * this: a newly added instance is seeded with its final value, so it has nothing to ease from.
 * Scaling the quad in the shader keeps the whole entrance on the GPU, one attribute wide, however
 * many markers arrive at once.
 */
export class SpritePopExtension extends LayerExtension {
    public static extensionName = 'SpritePopExtension';

    public static defaultProps = {
        getSpawnTime: {type: 'accessor', value: 0},
        latestSpawn: {type: 'number', value: 0},
    };

    public getShaders() {
        return {
            modules: [popUniforms],
            inject: {
                'vs:#decl': declaration,
                'vs:DECKGL_FILTER_SIZE': 'size *= spritePop_scale();',
            },
        };
    }

    public initializeState(this: Layer<SpritePopProps>): void {
        this.getAttributeManager()?.addInstanced({
            instanceSpawnTimes: {size: 1, accessor: 'getSpawnTime', defaultValue: 0},
        });
    }

    public draw(this: Layer<SpritePopProps>): void {
        const now = popClock();
        this.setShaderModuleProps({spritePop: {now, duration: SPRITE_POP_MS}});

        // Nothing else drives frames while the map sits still, so the layer asks for its own.
        if (now - (this.props.latestSpawn ?? 0) < SPRITE_POP_MS) {
            this.setNeedsRedraw();
        }
    }
}
