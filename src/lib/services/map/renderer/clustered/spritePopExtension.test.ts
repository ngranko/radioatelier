import type {Layer} from '@deck.gl/core';
import {describe, expect, it, vi} from 'vitest';
import {SPRITE_POP_IN_MS, SPRITE_POP_OUT_MS, SpritePopExtension} from './spritePopExtension';
import {getPopClock} from './spriteSpawns';

function createFakeLayer(latestPop: number) {
    const attributeManager = {addInstanced: vi.fn()};
    return {
        props: {latestPop},
        getAttributeManager: () => attributeManager,
        setShaderModuleProps: vi.fn(),
        setNeedsRedraw: vi.fn(),
        attributeManager,
    };
}

type Hook = (this: unknown, ...args: unknown[]) => unknown;

function callOn(
    extension: SpritePopExtension,
    method: 'initializeState' | 'draw' | 'getShaders',
    layer = createFakeLayer(0),
) {
    return (extension[method] as Hook).call(layer as unknown as Layer, {}, extension);
}

function shadersOf(extension: SpritePopExtension) {
    return (extension.getShaders as Hook).call({}, extension) as {
        inject: Record<string, string>;
        modules: {name: string; uniformTypes: Record<string, string>}[];
    };
}

describe('SpritePopExtension', () => {
    it('scales the quad through the size hook deck.gl exposes', () => {
        const {inject, modules} = shadersOf(new SpritePopExtension());

        expect(inject['vs:DECKGL_FILTER_SIZE']).toBe('size *= spritePop_scale();');
        expect(inject['vs:#decl']).toContain('in float instancePopTimes;');
        expect(modules[0].uniformTypes).toEqual({now: 'f32', duration: 'f32'});
    });

    it('grows by default and shrinks when reversed', () => {
        const growing = shadersOf(new SpritePopExtension()).inject['vs:#decl'];
        const shrinking = shadersOf(new SpritePopExtension({reverse: true})).inject['vs:#decl'];

        expect(growing).toContain('1.70158');
        expect(shrinking).toContain('1.0 - t * t * t');
    });

    it('carries the pop stamp as its own instanced attribute', () => {
        const layer = createFakeLayer(0);

        callOn(new SpritePopExtension(), 'initializeState', layer);

        expect(layer.attributeManager.addInstanced).toHaveBeenCalledWith({
            instancePopTimes: {size: 1, accessor: 'getPopTime', defaultValue: 0},
        });
    });

    it('asks for another frame only while a sprite is still moving', () => {
        const animating = createFakeLayer(getPopClock());
        const settled = createFakeLayer(getPopClock() - SPRITE_POP_IN_MS * 2);

        callOn(new SpritePopExtension(), 'draw', animating);
        callOn(new SpritePopExtension(), 'draw', settled);

        expect(animating.setNeedsRedraw).toHaveBeenCalled();
        expect(settled.setNeedsRedraw).not.toHaveBeenCalled();
    });

    it('animates an exit over its own shorter duration', () => {
        const layer = createFakeLayer(getPopClock());

        callOn(
            new SpritePopExtension({reverse: true, durationMs: SPRITE_POP_OUT_MS}),
            'draw',
            layer,
        );

        expect(layer.setShaderModuleProps).toHaveBeenCalledWith({
            spritePop: {now: expect.any(Number), duration: SPRITE_POP_OUT_MS},
        });
    });
});
