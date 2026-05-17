/// <reference types="svelte-clerk/env" />

declare module '$env/static/public' {
    export const PUBLIC_GOOGLE_MAPS_API_KEY: string;
    export const PUBLIC_GOOGLE_MAPS_MAP_ID: string;
}

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }
}

export {};
