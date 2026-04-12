import type {Id} from '$convex/_generated/dataModel';
import type {LooseObject} from '$lib/interfaces/object';
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

export const schema = z.object({
    id: z.preprocess(
        emptyOrMissingToNull,
        z
            .string()
            .transform(v => v as Id<'objects'>)
            .nullable(),
    ),
    latitude: coordinateField(-90, 90, 'Широта должна быть от -90 до 90'),
    longitude: coordinateField(-180, 180, 'Долгота должна быть от -180 до 180'),
    cover: z.preprocess(
        emptyOrMissingToNull,
        z
            .string()
            .transform(v => v as Id<'images'>)
            .nullable(),
    ),
    isPublic: z.boolean(),
    isVisited: z.boolean(),
    name: z.string().min(1, 'Пожалуйста, введите название').max(255, 'Слишком длинное название'),
    description: z.preprocess(emptyOrMissingToNull, z.string().nullable()),
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
    isRemoved: z.boolean(),
    removalPeriod: z.preprocess(
        emptyOrMissingToNull,
        z.string().max(20, 'Слишком длинный период утраты').nullable(),
    ),
    source: z.preprocess(
        emptyOrMissingToNull,
        z.union([z.url('Должна быть валидной ссылкой'), z.null()]),
    ),
});
