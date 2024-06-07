export interface CreateCategoryInputs {
    name: string;
}

export type CreateCategoryResponsePayload = Category;

export interface ListCategoriesResponsePayload {
    categories: Category[];
}

interface Category {
    id: string;
    name: string;
}
