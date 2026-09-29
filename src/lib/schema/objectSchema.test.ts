import {describeValidationFailure} from '$lib/utils/formErrors';
import {superValidate} from 'sveltekit-superforms';
import {zod4} from 'sveltekit-superforms/adapters';
import {describe, expect, it} from 'vitest';
import {schema} from './objectSchema';

describe('object schema', () => {
    it('reports errors in the order the form lays its fields out', async () => {
        const form = await superValidate(
            {latitude: 0, longitude: 0, name: 'x', category: '', description: 'x'.repeat(100_000)},
            zod4(schema),
        );

        expect(Object.keys(form.errors)).toEqual(['category', 'description']);
        expect(describeValidationFailure(form.errors)).toBe('Нужно выбрать категорию');
    });
});
