const xoConfig = [
  {
    ignores: ['node_modules', 'dist', 'prisma/**'],
  },
  {
    prettier: 'compat',
    space: true,
    rules: {
      'new-cap': 'off',
    },
  },
];

export default xoConfig;
