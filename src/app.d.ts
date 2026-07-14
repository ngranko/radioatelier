/// <reference types="svelte-clerk/env" />

declare module '$env/static/public' {
    export const PUBLIC_GOOGLE_MAPS_API_KEY: string;
    export const PUBLIC_GOOGLE_MAPS_MAP_ID: string;
    export const PUBLIC_POSTHOG_PROJECT_TOKEN: string;
    export const PUBLIC_POSTHOG_HOST: string;
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
