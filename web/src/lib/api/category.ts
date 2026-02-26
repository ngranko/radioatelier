import {METHOD_GET} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest, {type JsonRequestOptions} from '$lib/api/request/JsonRequest';
import type {Payload} from '$lib/interfaces/api';
import type {ListCategoriesResponsePayload} from '$lib/interfaces/category';

export async function listCategories(
    options: JsonRequestOptions,
): Promise<Payload<ListCategoriesResponsePayload>> {
    return new AuthRequest(new JsonRequest('/api/category/list', METHOD_GET, options)).send();
}
