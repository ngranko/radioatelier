import type {ValidationErrors} from 'sveltekit-superforms';

export type FormErrorMap = Record<string, string | string[] | undefined>;

export function getErrorArray(fieldErrors: any): string[] | null {
    if (!fieldErrors) {
        return null;
    }
    if (Array.isArray(fieldErrors)) {
        return fieldErrors;
    }
    if (fieldErrors._errors) {
        return fieldErrors._errors;
    }
    return null;
}

export function normalizeFormErrors<T extends Record<string, unknown>>(
    errorsToNormalize: FormErrorMap | null | undefined,
    currentValues: T,
): Partial<ValidationErrors<T>> {
    if (!errorsToNormalize) {
        return {};
    }

    const normalizedEntries = Object.entries(errorsToNormalize).flatMap(([rawKey, value]) => {
        if (!(rawKey in currentValues)) {
            return [];
        }

        const key = rawKey as keyof T;
        const messages = normalizeMessages(value);

        if (!messages) {
            return [];
        }

        const fieldValue = currentValues[key];

        return [[key, normalizeFieldErrors(fieldValue, messages)] as const];
    });

    return Object.fromEntries(normalizedEntries) as Partial<ValidationErrors<T>>;
}

function normalizeMessages(value: string | string[] | undefined): string[] | null {
    if (!value) {
        return null;
    }

    return Array.isArray(value) ? value : [value];
}

function normalizeFieldErrors(fieldValue: unknown, messages: string[]): unknown {
    if (Array.isArray(fieldValue)) {
        // for array fields this is the structure of the error field
        return {
            _errors: messages,
        } satisfies ValidationErrors<Record<string, unknown>>[keyof Record<string, unknown>];
    }

    return messages;
}
