import {type FlatXoConfig} from 'xo';

const xoConfig: FlatXoConfig = [
  {
    ignores: ['node_modules', 'postcss.config.mjs', 'src/components/ui'],
  },
  {
    react: true,
    prettier: 'compat',
    space: true,
    rules: {
      // React 17+ JSX transform
      'react/react-in-jsx-scope': 'off',

      // Disable console logs in frontend
      'no-console': ['error'],

      // Force exhaustive dependencies in useEffect hooks by default
      'react-hooks/exhaustive-deps': 'error',

      // Annoying
      '@typescript-eslint/capitalized-comments': 'off',
      'capitalized-comments': 'off',
      'unicorn/prevent-abbreviations': 'off',

      // React/Vite conventions (PascalCase components allowed)
      'unicorn/filename-case': 'off',
      'unicorn/prefer-module': 'off',
      'import-x/no-unassigned-import': 'off',
      'n/file-extension-in-import': 'off',
      'import-x/extensions': 'off',

      // Typescript rules (avoid rules that force edits that can change runtime behavior)
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',

      // Code rules
      'max-params': 'error',
    },
  },
];

export default xoConfig;
