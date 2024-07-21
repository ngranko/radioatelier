import {createMutation, type CreateMutationResult, type QueryClient} from '@tanstack/svelte-query';
import {repositionObject} from '$lib/api/object';
import type {Payload} from '$lib/interfaces/api';
import type {
    BareObject,
    GetObjectResponsePayload,
    ListObjectsResponsePayload,
    RepositionObjectInputs,
} from '$lib/interfaces/object';

export function useRepositionMutation(
    client: QueryClient,
): CreateMutationResult<Payload<BareObject>, Error, RepositionObjectInputs> {
    return createMutation({
        mutationFn: repositionObject,
        onSuccess: async ({data}) => {
            updateObjectCacheIfExists(client, data);
            updateListCacheIfExists(client, data);
        },
        onError: async error => {
            console.error(error);
        },
    });
}

function updateObjectCacheIfExists(client: QueryClient, data: BareObject) {
    const cachedValue = getObjectCache(client, data.id!);
    if (cachedValue) {
        updateObjectCache(client, cachedValue, data);
    }
}

function getObjectCache(
    client: QueryClient,
    id: string,
): Payload<GetObjectResponsePayload> | undefined {
    return client.getQueryData(['object', {id}]);
}

function updateObjectCache(
    client: QueryClient,
    cachedValue: Payload<GetObjectResponsePayload>,
    data: BareObject,
) {
    client.setQueryData(['object', {id: data.id}], {
        ...cachedValue,
        data: {
            object: {
                ...cachedValue.data.object,
                lat: data.lat,
                lng: data.lng,
            },
        },
    });
}

function updateListCacheIfExists(client: QueryClient, data: BareObject) {
    const cachedValue = getListCache(client);
    if (cachedValue) {
        updateListCache(client, cachedValue, data);
    }
}

function getListCache(client: QueryClient): Payload<ListObjectsResponsePayload> | undefined {
    return client.getQueryData(['objects']);
}

function updateListCache(
    client: QueryClient,
    cachedValue: Payload<ListObjectsResponsePayload>,
    data: BareObject,
) {
    client.setQueryData(['objects'], {
        ...cachedValue,
        data: {
            objects: cachedValue.data.objects.map(object => {
                if (object.id === data.id) {
                    return {
                        ...object,
                        lat: data.lat,
                        lng: data.lng,
                    };
                }
                return object;
            }),
        },
    });
}
