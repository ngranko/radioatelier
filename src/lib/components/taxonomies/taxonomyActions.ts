import {api} from '$convex/_generated/api';
import type {Id} from '$convex/_generated/dataModel';
import type {TaxonomyType} from '$lib/interfaces/taxonomy';
import type {ConvexClient} from 'convex/browser';

interface TaxonomyActions {
    rename(id: string, name: string): Promise<unknown>;
    remove(id: string, replacementId: string | null): Promise<unknown>;
}

// List entries and picker options carry plain string ids, so this is the one
// place they are narrowed to the table each kind lives in.
export function bindTaxonomyActions(client: ConvexClient): Record<TaxonomyType, TaxonomyActions> {
    return {
        category: {
            rename: (id, name) =>
                client.mutation(api.categories.rename, {id: id as Id<'categories'>, name}),
            remove: (id, replacementId) =>
                client.mutation(api.categories.remove, {
                    id: id as Id<'categories'>,
                    replacementId: replacementId as Id<'categories'> | null,
                }),
        },
        tag: {
            rename: (id, name) => client.mutation(api.tags.rename, {id: id as Id<'tags'>, name}),
            remove: (id, replacementId) =>
                client.mutation(api.tags.remove, {
                    id: id as Id<'tags'>,
                    replacementId: replacementId as Id<'tags'> | null,
                }),
        },
        privateTag: {
            rename: (id, name) =>
                client.mutation(api.privateTags.rename, {id: id as Id<'privateTags'>, name}),
            remove: (id, replacementId) =>
                client.mutation(api.privateTags.remove, {
                    id: id as Id<'privateTags'>,
                    replacementId: replacementId as Id<'privateTags'> | null,
                }),
        },
    };
}
