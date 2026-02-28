import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
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
        ignores: ['.svelte-kit', 'build', 'convex/_generated', '**/*.js', '**/*.jsx'],
    },
    {
        files: ['**!/!*.ts', '**!/!*.tsx', '**/*.svelte'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
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
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            curly: ['error', 'all'],
            '@stylistic/brace-style': ['error', '1tbs', {allowSingleLine: false}],
        },
    },
    eslintConfigPrettier,
];
