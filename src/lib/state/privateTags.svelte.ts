import type {PrivateTag} from '$lib/interfaces/privateTag';

interface PrivateTagsState {
    privateTags: PrivateTag[];
}

export const privateTagsState = $state<PrivateTagsState>({privateTags: []});

export function setPrivateTags(privateTags: PrivateTag[]) {
    privateTagsState.privateTags = privateTags.sort((a, b) => a.name.localeCompare(b.name));
}
