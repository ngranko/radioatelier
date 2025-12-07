import {z} from 'zod';

export const schema = z.object({
    id: z.string().optional().nullable(),
    lat: z.string().min(1),
    lng: z.string().min(1),
    cover: z.string().optional(),
    isPublic: z.boolean(),
    isVisited: z.boolean(),
    name: z.string().min(1, 'Пожалуйста, введите название').max(255, 'Слишком длинное название'),
    description: z.string().optional(),
    category: z.string().min(1, 'Нужно выбрать категорию'),
    tags: z.array(z.string()),
    privateTags: z.array(z.string()),
    address: z.string().max(128, 'Слишком длинный адрес').optional(),
    city: z.string().max(64, 'Слишком длинное название города').optional(),
    country: z.string().max(64, 'Слишком длинное название страны').optional(),
    installedPeriod: z.string().max(20, 'Слишком длинный период создания').optional(),
    isRemoved: z.boolean(),
    removalPeriod: z.string().max(20, 'Слишком длинный период утраты').optional(),
    source: z.url('Должна быть валидной ссылкой').or(z.literal('')),
});
