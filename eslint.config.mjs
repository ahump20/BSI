import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default [
    eslint.configs.recommended,
  {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
                parser: tsparser,
                parserOptions: {
                          ecmaVersion: 'latest',
                          sourceType: 'module',
                          ecmaFeatures: { jsx: true },
                },
        },
        plugins: {
                '@typescript-eslint': tseslint,
                react: reactPlugin,
                'react-hooks': reactHooksPlugin,
        },
        rules: {
                // TypeScript
          '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
                '@typescript-eslint/no-explicit-any': 'warn',
                '@typescript-eslint/consistent-type-imports': 'warn',

                // React
                'react/react-in-jsx-scope': 'off',
                'react/prop-types': 'off',
                'react-hooks/rules-of-hooks': 'error',
                'react-hooks/exhaustive-deps': 'warn',

                // General
                'no-console': ['warn', { allow: ['warn', 'error'] }],
                'prefer-const': 'error',
                'no-unused-vars': 'off', // handled by @typescript-eslint
        },
        settings: {
                react: { version: 'detect' },
        },
  },
  {
        ignores: [
                'node_modules/**',
                '.next/**',
                'out/**',
                'dist/**',
                'public/**',
                'games/**',
                'Assets/**',
                '*.config.*',
              ],
  },
    prettierConfig,
  ];
