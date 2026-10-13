import type {Id} from '$convex/_generated/dataModel';
import type {LooseObject} from '$lib/interfaces/object';
import {LIMITS} from '$lib/utils/fieldLimits';
import {z} from 'zod';

const emptyOrMissingToNull = (v: unknown) => (!v ? null : v);

const coordinateField = (min: number, max: number, message: string) =>
    z.preprocess(
        value => (value === '' || value === null || value === undefined ? NaN : Number(value)),
        z.number().min(min, message).max(max, message),
    );

export type ObjectFormData = z.infer<typeof schema>;

export function toFormDefaults(obj: Partial<LooseObject>): Partial<ObjectFormData> {
    return {
        ...obj,
        category: (obj.category?.id ?? '') as Id<'categories'>,
        tags: obj.tags?.map(tag => tag.id) ?? [],
        privateTags: obj.privateTags?.map(tag => tag.id) ?? [],
        cover: obj.cover?.id,
    };
}

// Keys follow the form's layout: superforms reports errors in this order, and
// the failure toast names the first one, so it should be the field the form
// scrolls to.
export const schema = z.object({
    cover: z.preprocess(
        emptyOrMissingToNull,
        z
            .string()
            .transform(v => v as Id<'images'>)
            .nullable(),
    ),
    id: z.preprocess(
        emptyOrMissingToNull,
        z
            .string()
            .transform(v => v as Id<'objects'>)
            .nullable(),
    ),
    latitude: coordinateField(-90, 90, 'Широта должна быть от -90 до 90'),
    longitude: coordinateField(-180, 180, 'Долгота должна быть от -180 до 180'),
    name: z.string().min(1, 'Пожалуйста, введите название').max(255, 'Слишком длинное название'),
    isVisited: z.boolean(),
    isRemoved: z.boolean(),
    isPublic: z.boolean(),
    category: z
        .string()
        .min(1, 'Нужно выбрать категорию')
        .transform(v => v as Id<'categories'>),
    tags: z.array(z.string().transform(v => v as Id<'tags'>)),
    privateTags: z.array(z.string().transform(v => v as Id<'privateTags'>)),
    address: z.preprocess(
        emptyOrMissingToNull,
        z.string().max(128, 'Слишком длинный адрес').nullable(),
    ),
    city: z.preprocess(
        emptyOrMissingToNull,
        z.string().max(64, 'Слишком длинное название города').nullable(),
    ),
    country: z.preprocess(
        emptyOrMissingToNull,
        z.string().max(64, 'Слишком длинное название страны').nullable(),
    ),
    installedPeriod: z.preprocess(
        emptyOrMissingToNull,
        z.string().max(20, 'Слишком длинный период создания').nullable(),
    ),
    removalPeriod: z.preprocess(
        emptyOrMissingToNull,
        z.string().max(20, 'Слишком длинный период утраты').nullable(),
    ),
    description: z.preprocess(
        emptyOrMissingToNull,
        z.string().max(LIMITS.description, 'Слишком длинное описание').nullable(),
    ),
    source: z.preprocess(
        emptyOrMissingToNull,
        z.union([
            z
                .url({protocol: /^https?$/, error: 'Должна быть валидной ссылкой http или https'})
                .max(LIMITS.source, 'Слишком длинная ссылка'),
            z.null(),
        ]),
    ),
});
