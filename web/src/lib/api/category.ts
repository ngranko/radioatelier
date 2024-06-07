import type {Payload} from '$lib/interfaces/api';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest from '$lib/api/request/JsonRequest';
import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
import type {
    CreateCategoryInputs,
    CreateCategoryResponsePayload,
    ListCategoriesResponsePayload,
} from '$lib/interfaces/category';

export async function createCategory(
    values: CreateCategoryInputs,
): Promise<Payload<CreateCategoryResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/category', METHOD_POST).setParams(values)).send();
}

export async function listCategories(): Promise<Payload<ListCategoriesResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/category/list', METHOD_GET)).send();
}
