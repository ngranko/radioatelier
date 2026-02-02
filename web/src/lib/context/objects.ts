import {getContext, setContext} from 'svelte';
import type {ObjectListItem} from '$lib/interfaces/object';

const KEY = 'objects';

export interface ObjectsContext {
    readonly items: ObjectListItem[];
    update: (id: string, updates: Partial<ObjectListItem>) => void;
    add: (obj: ObjectListItem) => void;
    remove: (id: string) => void;
}

export function setObjectsContext(ctx: ObjectsContext) {
    setContext(KEY, ctx);
}

export function getObjectsContext(): ObjectsContext {
    return getContext(KEY);
}
