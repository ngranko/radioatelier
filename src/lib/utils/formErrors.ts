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

export function describeValidationFailure(errors: unknown): string {
    const fieldErrors = typeof errors === 'object' && errors !== null ? Object.values(errors) : [];
    for (const value of fieldErrors) {
        const message = getErrorArray(value)?.[0];
        if (message) {
            return message;
        }
    }
    return 'Что-то не так во введенных данных';
}
