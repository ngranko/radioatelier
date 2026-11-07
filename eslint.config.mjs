// ESLint's remaining job is Svelte template linting and Tailwind class checks for
// .svelte files — everything else is covered by oxlint (see .oxlintrc.json).
// The lint script scopes eslint to src/**/*.svelte; drop ESLint entirely once
// oxlint ships Svelte template support.
import tsParser from '@typescript-eslint/parser';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';

export default [
    {ignores: ['.svelte-kit/', 'build/', 'src/convex/_generated/']},
    ...eslintPluginSvelte.configs['flat/recommended'],
    {
        files: ['**/*.svelte'],
        ...eslintPluginBetterTailwindcss.configs.recommended,
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
        settings: {
            'better-tailwindcss': {
                entryPoint: 'src/styles/app.css',
                detectComponentClasses: true,
            },
        },
        rules: {
            ...eslintPluginBetterTailwindcss.configs.recommended.rules,
            'svelte/no-navigation-without-resolve': 'off',
            // oxfmt's sortTailwindcss owns class order and line layout
            'better-tailwindcss/enforce-consistent-class-order': 'off',
            'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
            // shadcn's sonner wrapper tags the root with a non-Tailwind hook class
            'better-tailwindcss/no-unknown-classes': ['error', {ignore: ['^toaster$']}],
        },
    },
];
