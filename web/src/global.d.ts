declare global {
    interface Window {
        initMap(): void;
    }
}

export {};

declare module '@deck.gl/google-maps';
declare module '@deck.gl/layers';
