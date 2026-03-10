import Typesense from 'typesense';
import type {Id} from '../_generated/dataModel';
import {getTypesenseCollectionName} from './client';

export interface TypesenseObject {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    country: string | null;
    categoryName: string;
    location: [number, number];
    createdBy: string;
    isPublic: boolean;
}

export interface LocalSearchItem {
    id: Id<'objects'>;
    name: string;
    categoryName: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
    type: 'local';
}

interface TypesenseSearchHit {
    document?: TypesenseObject;
}

interface TypesenseSearchResponse {
    hits?: TypesenseSearchHit[];
}

interface OptionalSearchOptions {
    query: string;
    latitude: number;
    longitude: number;
    limit?: number;
    offset?: number;
    ownerId: Id<'users'>;
}

export async function addObjectToTypesense(
    client: InstanceType<typeof Typesense.Client>,
    object: TypesenseObject,
) {
    return client.collections(getTypesenseCollectionName()).documents().create(object);
}

export async function removeObjectFromTypesense(
    client: InstanceType<typeof Typesense.Client>,
    objectId: Id<'objects'>,
) {
    return client.collections(getTypesenseCollectionName()).documents(objectId).delete();
}

export async function updateObjectInTypesense(
    client: InstanceType<typeof Typesense.Client>,
    object: TypesenseObject,
) {
    return client.collections(getTypesenseCollectionName()).documents(object.id).update(object);
}

export async function searchObjectsInTypesense(
    client: InstanceType<typeof Typesense.Client>,
    options: OptionalSearchOptions,
) {
    const normalizedOptions = normalizeOptions(options);
    const response = (await client
        .collections(getTypesenseCollectionName())
        .documents()
        .search({
            q: normalizedOptions.query,
            query_by: 'name,address,city,country,categoryName',
            filter_by: `createdBy:=${normalizedOptions.ownerId} || isPublic:=true`,
            sort_by: `_text_match:desc,location(${normalizedOptions.latitude}, ${normalizedOptions.longitude}):asc`,
            prefix: true,
            per_page: normalizedOptions.limit,
            offset: normalizedOptions.offset,
        })) as TypesenseSearchResponse;

    return (response.hits ?? [])
        .map(hit => hit.document)
        .filter((document): document is TypesenseObject => document !== undefined)
        .map(document => ({
            id: document.id as Id<'objects'>,
            name: document.name,
            categoryName: document.categoryName,
            latitude: document.location[0],
            longitude: document.location[1],
            address: document.address ?? '',
            city: document.city ?? '',
            country: document.country ?? '',
            type: 'local' as const,
        }));
}

function normalizeOptions(options: OptionalSearchOptions) {
    return {
        query: options.query,
        latitude: options.latitude,
        longitude: options.longitude,
        limit: options.limit ?? 20,
        offset: options.offset ?? 0,
        ownerId: options.ownerId,
    };
}
