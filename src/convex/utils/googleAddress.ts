export interface GoogleAddressComponent {
    text: string;
    shortText?: string;
    types: string[];
}

export interface ParsedGoogleAddress {
    address: string;
    city: string;
    country: string;
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
    fallbackAddress = '',
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
    return components.find(component => component.types.includes(type))?.text ?? '';
}

function findAddressComponentShortText(components: GoogleAddressComponent[], type: string) {
    return components.find(component => component.types.includes(type))?.shortText ?? '';
}

function composeStreetAddress(
    streetNumber: string,
    streetName: string,
    country: string,
    countryCode: string,
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

function usesStreetNameFirst(country: string, countryCode: string) {
    if (STREET_NAME_FIRST_COUNTRY_CODES.has(countryCode.toUpperCase())) {
        return true;
    }

    return STREET_NAME_FIRST_COUNTRY_NAMES.has(normalizeCountryName(country));
}

function normalizeCountryName(country: string) {
    return country.trim().toLocaleLowerCase().normalize('NFKD').replace(/\p{M}/gu, '');
}
