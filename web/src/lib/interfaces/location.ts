export interface GetLocationResponseData {
    location: Location;
    accuracy: number;
}

export type GetAddressContext = [string, GetAddressInputs];

export interface GetAddressInputs {
    lat: string;
    lng: string;
}

export interface GetAddressResponseData {
    address: string;
    city: string;
    country: string;
}

export interface Location {
    lat: number;
    lng: number;
    zoom?: number;
}
