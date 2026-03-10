export type FormErrorMap = Record<string, string | string[] | undefined>;

export function getErrorArray(fieldErrors: unknown): string[] | null {
    if (!fieldErrors) {
        return null;
    }
    if (Array.isArray(fieldErrors) && fieldErrors.every(item => typeof item === 'string')) {
        return fieldErrors;
    }
    if (typeof fieldErrors === 'object' && fieldErrors !== null && '_errors' in fieldErrors) {
        const errors = (fieldErrors as Record<string, unknown>)._errors;
        return Array.isArray(errors) && errors.every(item => typeof item === 'string')
            ? errors
            : null;
    }
    return null;
}
