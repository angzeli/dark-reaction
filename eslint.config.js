import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'playwright-report/**', 'test-results/**', 'public/fonts/generated/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // typescript-eslint turns off no-undef for TypeScript (the compiler checks names),
    // so no globals list is needed here.
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: 'Use a union of string literals; enums are not erasable syntax.' },
        { selector: 'TSModuleDeclaration[kind="namespace"]', message: 'Namespaces are not erasable syntax.' },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'The game makes no network requests at runtime.' },
        { name: 'XMLHttpRequest', message: 'The game makes no network requests at runtime.' },
        { name: 'WebSocket', message: 'The game makes no network requests at runtime.' },
        { name: 'EventSource', message: 'The game makes no network requests at runtime.' },
      ],
    },
  },
  {
    files: ['scripts/**', 'e2e/**', 'playwright.config.ts', 'vite.config.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
);
