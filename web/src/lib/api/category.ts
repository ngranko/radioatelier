import {METHOD_GET, METHOD_POST} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest, {type JsonRequestOptions} from '$lib/api/request/JsonRequest';
import type {Payload} from '$lib/interfaces/api';
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

export async function listCategories(
    options: JsonRequestOptions,
): Promise<Payload<ListCategoriesResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/category/list', METHOD_GET, options)).send();
}
