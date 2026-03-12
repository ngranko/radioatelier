export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
    preference: ThemePreference;
    resolved: ResolvedTheme;
}

function getSystemTheme(): ResolvedTheme {
    if (typeof window === 'undefined') {
        return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: ResolvedTheme) {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
    return preference === 'system' ? getSystemTheme() : preference;
}

export const themeState: ThemeState = $state({
    preference: 'system',
    resolved: 'light',
});

export function initTheme() {
    const stored = localStorage.getItem('theme') as ThemePreference | null;
    const preference = stored ?? 'system';

    themeState.preference = preference;
    themeState.resolved = resolveTheme(preference);
    applyTheme(themeState.resolved);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
        if (themeState.preference !== 'system') {
            return;
        }
        themeState.resolved = getSystemTheme();
        applyTheme(themeState.resolved);
    });
}

export function setTheme(preference: ThemePreference) {
    themeState.preference = preference;
    themeState.resolved = resolveTheme(preference);
    localStorage.setItem('theme', preference);
    applyTheme(themeState.resolved);
}
