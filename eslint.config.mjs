import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

/** Layer rules (CLAUDE.md): app → features → services → core; components only use core. */
const restrict = (patterns) => ({
  'no-restricted-imports': ['error', { patterns }],
});

const UI_LIBS = [
  'react',
  'react-dom',
  'react/*',
  'next',
  'next/*',
  'dexie',
  'howler',
  'zustand',
  'zustand/*',
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['src/core/**'],
    rules: restrict([
      { group: UI_LIBS, message: 'core/ must stay framework-free (pure TypeScript).' },
      {
        group: ['@/services/*', '@/features/*', '@/components/*', '@/app/*'],
        message: 'core/ cannot depend on upper layers.',
      },
    ]),
  },
  {
    files: ['src/services/**'],
    rules: restrict([
      {
        group: ['@/features/*', '@/components/*', '@/app/*'],
        message: 'services/ cannot depend on features, components or app.',
      },
    ]),
  },
  {
    files: ['src/components/**'],
    rules: restrict([
      {
        group: ['@/services/*', '@/features/*', '@/app/*'],
        message: 'components/ are presentational: pass data in via props.',
      },
    ]),
  },
  {
    files: ['src/features/**'],
    rules: restrict([
      {
        group: ['@/features/*', '@/app/*'],
        message:
          'A feature must not import another feature; move shared code to services/ or components/.',
      },
    ]),
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'coverage/**']),
]);

export default eslintConfig;
