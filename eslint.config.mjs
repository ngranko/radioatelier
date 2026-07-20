import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';
import tseslint from 'typescript-eslint';

export default [
    // A config entry with only `ignores` applies globally; ignores inside the
    // file-scoped entries below don't shield the base configs from these paths.
    {ignores: ['.svelte-kit/', 'build/', 'src/convex/_generated/']},
    js.configs.recommended,
    {
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: {globals: {...globals.node}},
    },
    ...tseslint.configs.recommended,
    ...eslintPluginSvelte.configs['flat/recommended'],
    eslintPluginPrettierRecommended,
    eslintConfigPrettier,
    {
        files: ['**/*.svelte'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                google: 'readonly',
            },
            parser: svelteParser,
            ecmaVersion: 2022,
            sourceType: 'module',
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
                extraFileExtensions: ['.svelte'],
                parser: tsParser,
            },
        },
        rules: {
            curly: ['error', 'all'],
            'svelte/no-navigation-without-resolve': 'off',
            '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
        },
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                google: 'readonly',
            },
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        rules: {
            curly: ['error', 'all'],
            'svelte/no-navigation-without-resolve': 'off',
            '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
        },
    },
];
