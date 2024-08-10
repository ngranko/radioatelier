export interface CreateCategoryInputs {
    name: string;
}

export type CreateCategoryResponsePayload = Category;

export interface ListCategoriesResponsePayload {
    categories: Category[];
}

export interface Category {
    id: string;
    name: string;
}
