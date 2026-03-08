import {METHOD_GET} from '$lib/api/constants';
import AuthRequest from '$lib/api/request/AuthRequest';
import JsonRequest from '$lib/api/request/JsonRequest';
import type {Payload} from '$lib/interfaces/api';
import type {
    SearchContext,
    SearchGoogleResponsePayload,
    SearchLocalResponsePayload,
} from '$lib/interfaces/object';
import type {QueryFunctionContext} from '@tanstack/svelte-query';

export async function searchPreview({
    queryKey: [, {query, latitude, longitude}],
}: QueryFunctionContext<SearchContext>): Promise<Payload<SearchLocalResponsePayload>> {
    return new AuthRequest(
        new JsonRequest(
            `/api/object/search/preview?query=${encodeURIComponent(query)}&lat=${latitude}&lng=${longitude}`,
            METHOD_GET,
        ),
    ).send();
}

export async function searchLocal({
    queryKey: [, {query, latitude, longitude}],
    pageParam = 0,
}: QueryFunctionContext<SearchContext, number>): Promise<Payload<SearchLocalResponsePayload>> {
    return new AuthRequest(
        new JsonRequest(
            `/api/object/search/local?query=${encodeURIComponent(query)}&lat=${latitude}&lng=${longitude}&offset=${pageParam}`,
            METHOD_GET,
        ),
    ).send();
}

export async function searchGoogle({
    queryKey: [, {query, latitude, longitude}],
    pageParam = '',
}: QueryFunctionContext<SearchContext, string>): Promise<Payload<SearchGoogleResponsePayload>> {
    return new AuthRequest(
        new JsonRequest(
            `/api/object/search/google?query=${encodeURIComponent(query)}&lat=${latitude}&lng=${longitude}&token=${pageParam}`,
            METHOD_GET,
        ),
    ).send();
}
