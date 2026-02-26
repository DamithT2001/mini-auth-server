// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'generated', 'src/generated', 'eslint.config.mjs'],
  },

  // Base JS rules
  eslint.configs.recommended,

  // TypeScript (non type-aware, lighter & faster)
  ...tseslint.configs.recommended,

  // Prettier integration
  eslintPluginPrettierRecommended,

  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },

  {
    rules: {
      /*
       * -------- RELAXED RULES --------
       */

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-empty-function': 'off',

      /*
       * -------- SAFETY --------
       */

      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/require-await': 'warn',

      /*
       * -------- GENERAL --------
       */

      'no-console': 'off',

      /*
       * -------- PRETTIER --------
       */

      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
);