const CHAT_COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-sonnet-5.5';
const REQUEST_TIMEOUT_MS = 60_000;

export class OpenRouterError extends Error {
    public constructor(
        message: string,
        public readonly status: number | null,
    ) {
        super(message);
    }
}

export interface StructuredRequest {
    apiKey: string;
    systemPrompt: string;
    userPrompt: string;
    imageDataUrl: string;
    schema: object;
}

export async function requestStructuredAnswer(request: StructuredRequest): Promise<unknown> {
    const response = await fetch(CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${request.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildRequestBody(request)),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
        throw new OpenRouterError(await response.text(), response.status);
    }
    const body = (await response.json()) as {choices?: {message?: {content?: string}}[]};
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
        throw new OpenRouterError('The model returned no content', null);
    }
    return JSON.parse(content);
}

function buildRequestBody(request: StructuredRequest) {
    return {
        model: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL,
        temperature: 0,
        messages: [
            {role: 'system', content: request.systemPrompt},
            {
                role: 'user',
                content: [
                    {type: 'image_url', image_url: {url: request.imageDataUrl}},
                    {type: 'text', text: request.userPrompt},
                ],
            },
        ],
        response_format: {
            type: 'json_schema',
            json_schema: {name: 'photo_analysis', strict: true, schema: request.schema},
        },
    };
}

// Providers behind OpenRouter don't all fetch remote image URLs, so the photo
// travels inline.
export async function fetchImageDataUrl(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load the photo: ${response.status}`);
    }
    const type = response.headers.get('content-type') ?? 'image/jpeg';
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return `data:${type};base64,${btoa(binary)}`;
}
