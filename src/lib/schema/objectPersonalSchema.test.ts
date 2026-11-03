import {superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';
import {describe, expect, it} from 'vitest';
import {objectPersonalSchema, toPersonalFormDefaults} from './objectPersonalSchema';

describe('personal Object form', () => {
    it('requires only personal fields and drops submitted shared fields', async () => {
        const submitted = {
            isVisited: true,
            privateTags: [],
            name: '',
            description: 'x'.repeat(100_000),
        };
        const form = await superValidate(submitted, zod4(objectPersonalSchema));
        expect(form.valid).toBe(true);
        expect(form.data).toEqual({isVisited: true, privateTags: []});
    });

    it('rejects invalid personal field types', () => {
        expect(objectPersonalSchema.safeParse({isVisited: 'yes', privateTags: 'tag'}).success).toBe(
            false,
        );
    });

    it('initializes personal defaults without copying Object metadata', () => {
        expect(toPersonalFormDefaults({name: 'Mosaic', isVisited: true})).toEqual({
            isVisited: true,
            privateTags: [],
        });
    });
});
