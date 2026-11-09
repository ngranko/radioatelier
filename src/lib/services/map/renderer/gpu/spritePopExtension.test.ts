import type {Layer} from '@deck.gl/core';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {SPRITE_POP_IN_MS, SpritePopExtension} from './spritePopExtension';
import {readPopNow} from './spritePopTimes';

const motion = vi.hoisted(() => ({prefersReducedMotion: {current: false}}));
vi.mock('svelte/motion', () => motion);

function createFakeLayer(latestPop: number) {
    return {
        props: {latestPop},
        setShaderModuleProps: vi.fn(),
        setNeedsRedraw: vi.fn(),
    };
}

type Hook = (this: unknown, ...args: unknown[]) => unknown;

function drawOn(extension: SpritePopExtension, layer: ReturnType<typeof createFakeLayer>) {
    (extension.draw as Hook).call(layer as unknown as Layer, {}, extension);
}

describe('SpritePopExtension', () => {
    afterEach(() => {
        motion.prefersReducedMotion.current = false;
    });

    it('asks for another frame only while a sprite is still moving', () => {
        const animating = createFakeLayer(readPopNow());
        const settled = createFakeLayer(readPopNow() - SPRITE_POP_IN_MS * 2);

        drawOn(new SpritePopExtension(), animating);
        drawOn(new SpritePopExtension(), settled);

        expect(animating.setNeedsRedraw).toHaveBeenCalled();
        expect(settled.setNeedsRedraw).not.toHaveBeenCalled();
    });

    it('collapses the pop for anyone who asked for less motion', () => {
        motion.prefersReducedMotion.current = true;
        const layer = createFakeLayer(readPopNow());

        drawOn(new SpritePopExtension(), layer);

        expect(layer.setShaderModuleProps).toHaveBeenCalledWith({
            spritePop: {now: expect.any(Number), duration: 1},
        });
    });
});
