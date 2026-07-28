export interface GoogleAddressComponent {
    text: string;
    shortText?: string;
    types: string[];
}

export interface ParsedGoogleAddress {
    address: string | null;
    city: string | null;
    country: string | null;
}

const STREET_NAME_FIRST_COUNTRY_CODES = new Set([
    'AT',
    'BY',
    'CH',
    'DE',
    'KZ',
    'PL',
    'RS',
    'RU',
    'UA',
]);

const STREET_NAME_FIRST_COUNTRY_NAMES = new Set([
    'austria',
    'belarus',
    'bielarus',
    'deutschland',
    'germany',
    'kazakhstan',
    'kazahstan',
    'osterreich',
    'poland',
    'polska',
    'rossiya',
    'russia',
    'schweiz',
    'serbia',
    'srbija',
    'switzerland',
    'ukraine',
    'ukraina',
    'weissrussland',
    'австрия',
    'беларусь',
    'германия',
    'казахстан',
    'польша',
    'россия',
    'сербия',
    'швейцария',
    'украина',
    'україна',
]);

export function parseGoogleAddress(
    components: GoogleAddressComponent[],
    fallbackAddress: string | null = null,
): ParsedGoogleAddress {
    const streetNumber = findAddressComponent(components, 'street_number');
    const streetName = findAddressComponent(components, 'route');
    const city = findAddressComponent(components, 'locality');
    const country = findAddressComponent(components, 'country');
    const countryCode = findAddressComponentShortText(components, 'country');

    return {
        address:
            composeStreetAddress(streetNumber, streetName, country, countryCode) || fallbackAddress,
        city,
        country,
    };
}

function findAddressComponent(components: GoogleAddressComponent[], type: string) {
    return normalizeComponentText(
        components.find(component => component.types.includes(type))?.text,
    );
}

function findAddressComponentShortText(components: GoogleAddressComponent[], type: string) {
    return normalizeComponentText(
        components.find(component => component.types.includes(type))?.shortText,
    );
}

function normalizeComponentText(value: string | undefined) {
    return value?.trim() ? value : null;
}

function composeStreetAddress(
    streetNumber: string | null,
    streetName: string | null,
    country: string | null,
    countryCode: string | null,
) {
    if (!streetNumber) {
        return streetName;
    }

    if (!streetName) {
        return streetNumber;
    }

    if (usesStreetNameFirst(country, countryCode)) {
        return `${streetName} ${streetNumber}`;
    }

    return `${streetNumber} ${streetName}`;
}

function usesStreetNameFirst(country: string | null, countryCode: string | null) {
    if (countryCode && STREET_NAME_FIRST_COUNTRY_CODES.has(countryCode.toUpperCase())) {
        return true;
    }

    if (!country) {
        return false;
    }

    return STREET_NAME_FIRST_COUNTRY_NAMES.has(normalizeCountryName(country));
}

function normalizeCountryName(country: string) {
    return country.trim().toLocaleLowerCase().normalize('NFKD').replace(/\p{M}/gu, '');
}
