import {describe, expect, it} from 'vitest';
import {markerSprite, type SpriteStyle} from './markerSprites';

function style(overrides: Partial<SpriteStyle> = {}): SpriteStyle {
    return {
        color: '#112233',
        iconKey: 'zap',
        isVisited: false,
        isRemoved: false,
        withHalo: true,
        ...overrides,
    };
}

describe('markerSprite', () => {
    it('reuses one atlas entry per style', () => {
        expect(markerSprite(style())).toBe(markerSprite(style()));
        expect(markerSprite(style()).id).not.toBe(markerSprite(style({isRemoved: true})).id);
        expect(markerSprite(style()).id).not.toBe(markerSprite(style({iconKey: 'house'})).id);
    });
});
