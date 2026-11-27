import {z} from 'zod';
import {LIMITS} from '../../../lib/utils/fieldLimits';
import type {Id} from '../../_generated/dataModel';

export interface Taxonomy<T extends 'categories' | 'tags'> {
    id: Id<T>;
    name: string;
}

export interface AnalysisContext {
    categories: Taxonomy<'categories'>[];
    tags: Taxonomy<'tags'>[];
    exampleTitles: string[];
    address: string | null;
}

export interface PhotoAnalysis {
    name: string;
    categoryId: Id<'categories'>;
    tagIds: Id<'tags'>[];
}

export class InvalidAnalysisError extends Error {}

const rawAnalysis = z.object({
    title: z.string().trim().min(1),
    category: z.string(),
    tags: z.array(z.string()),
});

export function buildSystemPrompt(context: AnalysisContext): string {
    return [
        'You catalogue objects for an archive of urban visual heritage: signs, plaques, mosaics,',
        'stained glass, ornamental glass and the like. The user photographed one such object.',
        '',
        'Title:',
        '- If the object carries text, the title is that text exactly as written: the same casing,',
        '  language and alphabet, no translation, no quotes. Join several lines with one space.',
        '- Only when the object has no text, write a short Russian description of it, matching the',
        '  style of the example titles below.',
        '',
        'Category: exactly one, the closest fit from the allowed list.',
        'Tags: only allowed tags that clearly apply; an empty list is fine.',
        '',
        'Example titles from the archive:',
        ...context.exampleTitles.map(title => `- ${title}`),
    ].join('\n');
}

export function buildUserPrompt(context: AnalysisContext): string {
    return context.address
        ? `The photo was taken at: ${context.address}`
        : 'The address of the photo is unknown.';
}

// Names rather than ids: the model reads them as words, and the enums keep it
// from inventing new ones.
export function buildResponseSchema(context: AnalysisContext) {
    return {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'category', 'tags'],
        properties: {
            title: {type: 'string'},
            category: {type: 'string', enum: context.categories.map(category => category.name)},
            tags: {
                type: 'array',
                items: {type: 'string', enum: context.tags.map(tag => tag.name)},
            },
        },
    };
}

export function resolveAnalysis(raw: unknown, context: AnalysisContext): PhotoAnalysis {
    const parsed = rawAnalysis.safeParse(raw);
    if (!parsed.success) {
        throw new InvalidAnalysisError('The model answered outside the response schema');
    }
    const category = context.categories.find(item => item.name === parsed.data.category);
    if (!category) {
        throw new InvalidAnalysisError(`Unknown category: ${parsed.data.category}`);
    }
    const tagIds = context.tags
        .filter(tag => parsed.data.tags.includes(tag.name))
        .map(tag => tag.id);
    return {name: parsed.data.title.slice(0, LIMITS.name), categoryId: category.id, tagIds};
}
