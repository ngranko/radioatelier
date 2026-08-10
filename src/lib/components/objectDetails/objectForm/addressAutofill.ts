export const ADDRESS_FIELDS = ['address', 'city', 'country'] as const;

export type AddressField = (typeof ADDRESS_FIELDS)[number];

export type AddressAutofillDecision =
    | {kind: 'ignore'}
    | {kind: 'remember'; incomingValue: string}
    | {kind: 'apply'; incomingValue: string};

/**
 * Decide whether a geocoded address field should overwrite the form.
 * Empty form values are only filled when the incoming value is new — clearing
 * a field must not snap back to a previously seen initial value.
 */
export function decideAddressAutofill(
    incomingValue: unknown,
    currentValue: unknown,
    lastSeenIncoming: string,
    lastAutoFilled: string,
): AddressAutofillDecision {
    if (typeof incomingValue !== 'string' || !incomingValue) {
        return {kind: 'ignore'};
    }

    if (incomingValue === lastSeenIncoming) {
        return {kind: 'ignore'};
    }

    const canOverwrite =
        typeof currentValue !== 'string' ||
        !currentValue ||
        currentValue === lastAutoFilled;

    if (!canOverwrite || currentValue === incomingValue) {
        return {kind: 'remember', incomingValue};
    }

    return {kind: 'apply', incomingValue};
}
