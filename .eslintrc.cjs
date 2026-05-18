'use strict';

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    tsconfigRootDir: __dirname,
    project: [
      './tsconfig.json',
      './tsconfig.e2e.json',
      './server/tsconfig.json',
      './server/tsconfig.test.json',
      './client/tsconfig.json',
      './client/tsconfig.test.json',
    ],
  },
  plugins: ['@typescript-eslint', 'import', 'i18next'],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json', './server/tsconfig.json', './client/tsconfig.json'],
      },
    },
  },
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-void': ['error', { allowAsStatement: true }],
  },
  overrides: [
    {
      files: [
        'client/src/**/*.tsx',
        'client/src/**/*.ts',
        'client/tests/**/*.tsx',
        'client/tests/**/*.ts',
      ],
      rules: {
        'react/react-in-jsx-scope': 'off',
        // Warn on hardcoded JSX strings — new code must use t(). Existing
        // violations are excluded via the allow-list below. This will be
        // promoted to 'error' in Epic 20 once the full string migration is done.
        'i18next/no-literal-string': [
          'warn',
          {
            mode: 'jsx-only',
            // Attributes that can legitimately hold raw strings
            ignoreAttribute: [
              'className',
              'class',
              'style',
              'id',
              'key',
              'name',
              'type',
              'role',
              'tabIndex',
              'aria-label',
              'aria-labelledby',
              'aria-describedby',
              'aria-controls',
              'aria-haspopup',
              'aria-expanded',
              'aria-checked',
              'aria-selected',
              'aria-live',
              'aria-atomic',
              'htmlFor',
              'href',
              'src',
              'alt',
              'target',
              'rel',
              'to',
              'path',
              'method',
              'action',
              'variant',
              'size',
              'color',
              'data-testid',
              'data-orientation',
              'data-theme',
              'data-text-size',
              'data-simplified-nav',
              'data-colour-blind',
              'strokeWidth',
              'viewBox',
              'xmlns',
              'fill',
              'stroke',
              'cx',
              'cy',
              'r',
              'x',
              'y',
              'd',
              'placeholder',
            ],
            // Components where children are not user-visible strings
            ignoreComponent: ['Route', 'Switch', 'Redirect', 'Navigate', 'Suspense'],
            // Function calls that take string literals but are not UI text
            ignoreCallee: [
              'clsx',
              'cn',
              'console.log',
              'console.warn',
              'console.error',
              'console.info',
              'logger.info',
              'logger.warn',
              'logger.error',
              'require',
              'Symbol',
              'Object.keys',
              'Object.values',
            ],
          },
        ],
      },
    },
    {
      files: ['**/*.config.ts', '**/*.config.js', '**/tests/**/*.ts', '**/tests/**/*.tsx'],
      rules: {
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      },
    },
    {
      files: ['e2e/**/*.ts', 'scripts/**/*.ts', 'playwright.config.ts'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: true,
            packageDir: [__dirname, `${__dirname}/server`, `${__dirname}/client`],
          },
        ],
        'no-console': 'off',
        'import/prefer-default-export': 'off',
        'no-restricted-syntax': 'off',
        'no-continue': 'off',
        'no-cond-assign': 'off',
        'no-await-in-loop': 'off',
        '@typescript-eslint/require-await': 'off',
        'no-promise-executor-return': 'off',
      },
    },
    {
      files: ['client/tests/mocks/**/*.ts'],
      rules: {
        'import/prefer-default-export': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', '*.js', '*.cjs', '*.mjs'],
};
