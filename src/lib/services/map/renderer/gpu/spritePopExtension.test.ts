import type {Layer} from '@deck.gl/core';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {SPRITE_POP_IN_MS, SPRITE_POP_OUT_MS, SpritePopExtension} from './spritePopExtension';
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

function shadersOf(extension: SpritePopExtension) {
    return (extension.getShaders as Hook).call({}, extension) as {
        inject: Record<string, string>;
    };
}

describe('SpritePopExtension', () => {
    afterEach(() => {
        motion.prefersReducedMotion.current = false;
    });

    it('grows by default and shrinks when reversed', () => {
        const growing = shadersOf(new SpritePopExtension()).inject['vs:#decl'];
        const shrinking = shadersOf(new SpritePopExtension({reverse: true})).inject['vs:#decl'];

        expect(growing).toContain('1.70158');
        expect(shrinking).toContain('1.0 - progress * progress * progress');
    });

    it('asks for another frame only while a sprite is still moving', () => {
        const animating = createFakeLayer(readPopNow());
        const settled = createFakeLayer(readPopNow() - SPRITE_POP_IN_MS * 2);

        drawOn(new SpritePopExtension(), animating);
        drawOn(new SpritePopExtension(), settled);

        expect(animating.setNeedsRedraw).toHaveBeenCalled();
        expect(settled.setNeedsRedraw).not.toHaveBeenCalled();
    });

    it('animates an exit over its own shorter duration', () => {
        const layer = createFakeLayer(readPopNow());

        drawOn(new SpritePopExtension({reverse: true, durationMs: SPRITE_POP_OUT_MS}), layer);

        expect(layer.setShaderModuleProps).toHaveBeenCalledWith({
            spritePop: {now: expect.any(Number), duration: SPRITE_POP_OUT_MS},
        });
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
