import type {Tag} from '$lib/interfaces/tag';

interface TagsState {
    tags: Tag[];
}

export const tagsState = $state<TagsState>({tags: []});

export function setTags(tags: Tag[]) {
    tagsState.tags = tags.sort((a, b) => a.name.localeCompare(b.name));
}
