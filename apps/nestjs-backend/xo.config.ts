// Since NestJS does not support ES modules yet, we need to use CommonJS modules. And since this is part of a turborepo, the xo package is installed at the root of the monorepo, so we can't access it here.

// import {type FlatXoConfig} from 'xo';

// const xoConfig: FlatXoConfig = [

const xoConfig = [
  {
    ignores: ['node_modules'],
    prettier: 'compat',
    space: true,
    rules: {
      // Disabled for flexibility in naming -> "component.props.ts" instead of "component.properties.ts"
      'unicorn/prevent-abbreviations': 'off',

      // Does not work with decorators
      'new-cap': 'off',

      // Code rules
      'max-params': 'error',

      // Annoying
      '@typescript-eslint/capitalized-comments': 'off',
      'capitalized-comments': 'off',

      // Typescript rules
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/no-unused-vars': 'error',

      // Nest.js specific rules
      '@typescript-eslint/consistent-type-imports': 'off', // Open API doc fails to recognize type import of DTOs correctly
      'n/prefer-global/process': 'off',
    },
  },

  // File-specific overrides
  // Note: Entity file overrides removed as Prisma uses a different approach
  // Prisma models are defined in schema.prisma, not TypeScript entity files
];

export default xoConfig;
