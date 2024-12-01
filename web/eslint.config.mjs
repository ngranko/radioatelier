import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import tsParser from '@typescript-eslint/parser';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...eslintPluginSvelte.configs['flat/recommended'],
    {
        ignores: ['.svelte-kit', '**/*.js', '**/*.jsx'],
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

        rules: {
            'array-callback-return': 'error',
            'no-await-in-loop': 'warn',
            'no-constructor-return': 'error',
            'no-inner-declarations': 'error',
            'no-promise-executor-return': 'error',
            'no-self-compare': 'error',
            'no-template-curly-in-string': 'error',

            'no-undef': [
                'error',
                {
                    typeof: true,
                },
            ],

            'no-unmodified-loop-condition': 'error',
            'no-unreachable-loop': 'error',

            'no-unsafe-optional-chaining': [
                'error',
                {
                    disallowArithmeticOperators: true,
                },
            ],

            'require-atomic-updates': 'error',
            'block-scoped-var': 'error',

            'class-methods-use-this': [
                'warn',
                {
                    exceptMethods: [
                        'componentWillMount',
                        'componentDidMount',
                        'componentDidUpdate',
                        'componentWillUnmount',
                        'render',
                    ],
                },
            ],

            'consistent-return': 'error',
            curly: 'error',
            'default-case': 'error',
            'default-case-last': 'error',
            eqeqeq: 'error',
            'func-name-matching': 'error',
            'grouped-accessor-pairs': 'error',
            'guard-for-in': 'error',

            'id-length': [
                'error',
                {
                    exceptions: ['i', 'a', 'b'],
                },
            ],

            'max-classes-per-file': 'error',
            'new-cap': 'error',
            'no-alert': 'error',
            'no-array-constructor': 'error',
            'no-bitwise': 'error',
            'no-caller': 'error',

            'no-console': [
                'warn',
                {
                    allow: ['info', 'warn', 'error'],
                },
            ],

            'no-div-regex': 'warn',
            'no-else-return': 'error',

            'no-empty': [
                'error',
                {
                    allowEmptyCatch: true,
                },
            ],

            'no-eq-null': 'warn',
            'no-eval': 'error',
            'no-extend-native': 'warn',
            'no-extra-bind': 'error',
            'no-implicit-coercion': 'error',
            'no-implicit-globals': 'error',
            'no-implied-eval': 'error',
            'no-iterator': 'error',
            'no-labels': 'error',
            'no-lone-blocks': 'error',
            'no-lonely-if': 'error',
            'no-multi-assign': 'error',
            'no-multi-str': 'error',
            'no-negated-condition': 'error',
            'no-nested-ternary': 'error',
            'no-new': 'error',
            'no-new-func': 'error',
            'no-new-wrappers': 'error',
            'no-object-constructor': 'error',
            'no-octal-escape': 'error',
            'no-param-reassign': 'error',
            'no-proto': 'error',
            'no-return-assign': ['error', 'always'],
            'no-script-url': 'error',
            'no-sequences': 'error',
            'no-undef-init': 'error',
            'no-unneeded-ternary': 'error',
            'no-useless-call': 'error',

            'no-useless-computed-key': [
                'error',
                {
                    enforceForClassMembers: true,
                },
            ],

            'no-useless-concat': 'error',
            'no-useless-rename': 'error',
            'no-useless-return': 'error',
            'no-var': 'error',

            'no-void': [
                'error',
                {
                    allowAsStatement: true,
                },
            ],

            'object-shorthand': 'error',
            'one-var': ['error', 'never'],
            'operator-assignment': ['error', 'always'],
            'prefer-const': 'error',
            'prefer-exponentiation-operator': 'error',
            'prefer-numeric-literals': 'error',
            'prefer-object-has-own': 'warn',
            'prefer-object-spread': 'warn',
            'prefer-rest-params': 'error',
            'prefer-spread': 'error',
            'prefer-template': 'error',
            radix: 'warn',
            'symbol-description': 'warn',
            yoda: 'error',
            'no-dupe-class-members': 'off',
            'no-redeclare': 'off',
            'no-unused-vars': 'off',

            // '@typescript-eslint/adjacent-overload-signatures': 'warn',
            // '@typescript-eslint/array-type': 'error',
            // '@typescript-eslint/class-methods-use-this': 'warn',
            // '@typescript-eslint/consistent-generic-constructors': ['error', 'constructor'],
            // '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
            //
            // '@typescript-eslint/consistent-type-assertions': [
            //     'error',
            //     {
            //         assertionStyle: 'as',
            //         objectLiteralTypeAssertions: 'allow-as-parameter',
            //     },
            // ],
            //
            // '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
            //
            // '@typescript-eslint/consistent-type-exports': [
            //     'error',
            //     {
            //         fixMixedExportsWithInlineTypeSpecifier: true,
            //     },
            // ],
            //
            // '@typescript-eslint/consistent-type-imports': 'error',
            // '@typescript-eslint/default-param-last': 'error',
            // '@typescript-eslint/dot-notation': 'error',
            //
            // '@typescript-eslint/explicit-member-accessibility': [
            //     'error',
            //     {
            //         overrides: {
            //             constructors: 'off',
            //         },
            //     },
            // ],
            //
            // '@typescript-eslint/max-params': ['warn', {max: 4}],
            //
            // '@typescript-eslint/member-ordering': [
            //     'error',
            //     {
            //         default: [
            //             'static-field',
            //             'instance-field',
            //             'constructor',
            //             'static-method',
            //             'instance-method',
            //         ],
            //     },
            // ],
            //
            // '@typescript-eslint/method-signature-style': ['error', 'method'],
            // '@typescript-eslint/no-confusing-non-null-assertion': 'error',
            //
            // '@typescript-eslint/no-confusing-void-expression': [
            //     'error',
            //     {
            //         ignoreArrowShorthand: true,
            //     },
            // ],
            //
            // '@typescript-eslint/no-deprecated': 'warn',
            // '@typescript-eslint/no-dupe-class-members': 'error',
            // '@typescript-eslint/no-dynamic-delete': 'error',
            // '@typescript-eslint/no-explicit-any': 'warn',
            // '@typescript-eslint/no-extraneous-class': 'error',
            // '@typescript-eslint/no-import-type-side-effects': 'error',
            // '@typescript-eslint/no-inferrable-types': 'error',
            // '@typescript-eslint/no-invalid-this': 'error',
            //
            // '@typescript-eslint/no-invalid-void-type': [
            //     'error',
            //     {
            //         allowAsThisParameter: true,
            //     },
            // ],
            //
            // '@typescript-eslint/no-loop-func': 'error',
            //
            // '@typescript-eslint/no-magic-numbers': [
            //     'warn',
            //     {
            //         ignore: [0, 1, 2, 100],
            //         ignoreArrayIndexes: true,
            //         enforceConst: true,
            //     },
            // ],
            //
            // '@typescript-eslint/no-meaningless-void-operator': 'error',
            // '@typescript-eslint/no-mixed-enums': 'error',
            // '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
            // '@typescript-eslint/no-redeclare': 'error',
            // '@typescript-eslint/no-shadow': 'error',
            // '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
            // '@typescript-eslint/no-unnecessary-condition': 'error',
            // '@typescript-eslint/no-unnecessary-qualifier': 'error',
            // '@typescript-eslint/no-unnecessary-template-expression': 'error',
            // '@typescript-eslint/no-unnecessary-type-arguments': 'warn',
            //
            // '@typescript-eslint/no-use-before-define': [
            //     'error',
            //     {
            //         functions: false,
            //         classes: false,
            //     },
            // ],
            //
            // '@typescript-eslint/no-useless-constructor': 'error',
            // '@typescript-eslint/no-useless-empty-export': 'error',
            // '@typescript-eslint/non-nullable-type-assertion-style': 'error',
            // '@typescript-eslint/parameter-properties': 'error',
            // '@typescript-eslint/prefer-enum-initializers': 'error',
            // '@typescript-eslint/prefer-find': 'error',
            // '@typescript-eslint/prefer-for-of': 'error',
            // '@typescript-eslint/prefer-function-type': 'error',
            // '@typescript-eslint/prefer-includes': 'error',
            // '@typescript-eslint/prefer-literal-enum-member': 'error',
            // '@typescript-eslint/prefer-nullish-coalescing': 'error',
            // '@typescript-eslint/prefer-optional-chain': 'error',
            // '@typescript-eslint/prefer-readonly': 'error',
            // '@typescript-eslint/prefer-reduce-type-parameter': 'error',
            // '@typescript-eslint/prefer-return-this-type': 'error',
            // '@typescript-eslint/prefer-string-starts-ends-with': 'error',
            // '@typescript-eslint/promise-function-async': 'error',
            // '@typescript-eslint/require-array-sort-compare': 'error',
            // '@typescript-eslint/switch-exhaustiveness-check': 'error',
            // '@typescript-eslint/unified-signatures': 'error',
            // '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',
        },
    },
    eslintConfigPrettier,
];
