// ESLint's remaining job is Svelte template linting and prettier enforcement for
// .svelte files — everything else is covered by oxlint (see .oxlintrc.json).
// The lint script scopes eslint to src/**/*.svelte; drop ESLint entirely once
// oxlint ships Svelte template support.
import tsParser from '@typescript-eslint/parser';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';

export default [
    {ignores: ['.svelte-kit/', 'build/', 'src/convex/_generated/']},
    ...eslintPluginSvelte.configs['flat/recommended'],
    eslintPluginPrettierRecommended,
    {
        files: ['**/*.svelte'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                google: 'readonly',
            },
            parser: svelteParser,
            // No projectService: none of the remaining rules are type-aware, and
            // skipping the whole-project TS program keeps this run fast.
            parserOptions: {
                extraFileExtensions: ['.svelte'],
                parser: tsParser,
            },
        },
        rules: {
            'svelte/no-navigation-without-resolve': 'off',
        },
    },
];
