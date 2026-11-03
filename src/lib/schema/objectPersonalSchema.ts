import type {Id} from '$convex/_generated/dataModel';
import type {LooseObject} from '$lib/interfaces/object';
import {z} from 'zod';

export const objectPersonalSchema = z.object({
    isVisited: z.boolean(),
    privateTags: z.array(z.string().transform(value => value as Id<'privateTags'>)),
});

export function toPersonalFormDefaults(object: Partial<LooseObject>) {
    return {
        isVisited: object.isVisited ?? false,
        privateTags: object.privateTags?.map(tag => tag.id) ?? [],
    };
}
