export interface GetLocationResponseData {
    location: Location;
    accuracy: number;
}

export interface Location {
    lat: number;
    lng: number;
}
