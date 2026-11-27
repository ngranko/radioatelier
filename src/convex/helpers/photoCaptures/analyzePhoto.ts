import {
    type AnalysisContext,
    buildResponseSchema,
    buildSystemPrompt,
    buildUserPrompt,
    InvalidAnalysisError,
    type PhotoAnalysis,
    resolveAnalysis,
} from './analysisPrompt';
import {fetchImageDataUrl, OpenRouterError, requestStructuredAnswer} from './openRouter';

export interface AnalysisInput {
    apiKey: string;
    imageUrl: string | null;
    context: AnalysisContext;
}

export async function analyzePhoto(input: AnalysisInput): Promise<PhotoAnalysis> {
    if (!input.imageUrl) {
        throw new Error('The photo is gone');
    }
    const answer = await requestStructuredAnswer({
        apiKey: input.apiKey,
        systemPrompt: buildSystemPrompt(input.context),
        userPrompt: buildUserPrompt(input.context),
        imageDataUrl: await fetchImageDataUrl(input.imageUrl),
        schema: buildResponseSchema(input.context),
    });
    return resolveAnalysis(answer, input.context);
}

// Short codes for the review list and analytics; the full error goes to the logs.
export function classifyAnalysisFailure(error: unknown): string {
    if (error instanceof OpenRouterError) {
        if (error.status === 401 || error.status === 403) {
            return 'key_rejected';
        }
        return error.status === 402 ? 'no_credits' : 'model_failed';
    }
    if (error instanceof InvalidAnalysisError || error instanceof SyntaxError) {
        return 'invalid_response';
    }
    return 'unexpected';
}
