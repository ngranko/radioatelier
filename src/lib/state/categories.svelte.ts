import type {Id} from '$convex/_generated/dataModel';
import type {Category} from '$lib/interfaces/category';

interface CategoriesState {
    categories: {[id: Id<'categories'>]: Category};
}

export const categoriesState = $state<CategoriesState>({categories: {}});

export function setCategories(categories: Category[]) {
    categoriesState.categories = categories.reduce(
        (acc, item) => {
            acc[item.id] = item;
            return acc;
        },
        {} as {[id: Id<'categories'>]: Category},
    );
}
