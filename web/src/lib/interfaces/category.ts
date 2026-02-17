import type {Id} from '$convex/_generated/dataModel';

export interface CreateCategoryInputs {
    name: string;
}

export type CreateCategoryResponsePayload = Category;

export interface ListCategoriesResponsePayload {
    categories: Category[];
}

export interface Category {
    id: Id<'categories'>;
    name: string;
}

export interface FuzzyCategory {
    id: Id<'categories'>;
    name: string;
}
