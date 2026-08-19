import type {Layer} from '@deck.gl/core';
import {describe, expect, it, vi} from 'vitest';
import {SPRITE_POP_MS, SpritePopExtension} from './spritePopExtension';
import {popClock} from './spriteSpawns';

function fakeLayer(latestSpawn: number) {
    const attributeManager = {addInstanced: vi.fn()};
    return {
        props: {latestSpawn},
        getAttributeManager: () => attributeManager,
        setShaderModuleProps: vi.fn(),
        setNeedsRedraw: vi.fn(),
        attributeManager,
    };
}

function callOn(layer: ReturnType<typeof fakeLayer>, method: 'initializeState' | 'draw') {
    const extension = new SpritePopExtension();
    (extension[method] as (this: unknown, ...args: unknown[]) => void).call(
        layer as unknown as Layer,
        {},
        extension,
    );
}

describe('SpritePopExtension', () => {
    it('scales the quad through the size hook deck.gl exposes', () => {
        const {inject, modules} = new SpritePopExtension().getShaders();

        expect(inject['vs:DECKGL_FILTER_SIZE']).toBe('size *= spritePop_scale();');
        expect(inject['vs:#decl']).toContain('in float instanceSpawnTimes;');
        expect(inject['vs:#decl']).toContain('clamp(');
        expect(modules[0].uniformTypes).toEqual({now: 'f32', duration: 'f32'});
    });

    it('carries the spawn stamp as its own instanced attribute', () => {
        const layer = fakeLayer(0);

        callOn(layer, 'initializeState');

        expect(layer.attributeManager.addInstanced).toHaveBeenCalledWith({
            instanceSpawnTimes: {size: 1, accessor: 'getSpawnTime', defaultValue: 0},
        });
    });

    it('asks for another frame only while a marker is still growing', () => {
        const animating = fakeLayer(popClock());
        const settled = fakeLayer(popClock() - SPRITE_POP_MS * 2);

        callOn(animating, 'draw');
        callOn(settled, 'draw');

        expect(animating.setNeedsRedraw).toHaveBeenCalled();
        expect(settled.setNeedsRedraw).not.toHaveBeenCalled();
        expect(settled.setShaderModuleProps).toHaveBeenCalledWith({
            spritePop: {now: expect.any(Number), duration: SPRITE_POP_MS},
        });
    });
});
