export interface HighlightSegment {
    text: string;
    hit: boolean;
}

/** Split `text` into segments so the part matching `query` can be emphasised. */
export function highlight(text: string, query: string): HighlightSegment[] {
    const needle = query.trim().toLowerCase();
    if (!needle) {
        return [{text, hit: false}];
    }

    const index = text.toLowerCase().indexOf(needle);
    if (index < 0) {
        return [{text, hit: false}];
    }

    return [
        {text: text.slice(0, index), hit: false},
        {text: text.slice(index, index + needle.length), hit: true},
        {text: text.slice(index + needle.length), hit: false},
    ].filter(segment => segment.text.length > 0);
}
