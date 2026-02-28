import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';
import tseslint from 'typescript-eslint';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...eslintPluginSvelte.configs['flat/recommended'],
    eslintPluginPrettierRecommended,
    {
        ignores: [
            '.svelte-kit',
            'build',
            'node_modules',
            'convex/_generated',
            '**/*.js',
            '**/*.jsx',
        ],
    },
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
    eslintConfigPrettier,
];
