// TypeScript 6+ no longer auto-includes every @types package; pull in the
// google.maps global namespace explicitly.
/// <reference types="google.maps" />

declare global {
    interface Window {
        initMap(): void;
    }
}

export {};

declare module '@deck.gl/google-maps';
declare module '@deck.gl/layers';
