import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintReact from 'eslint-plugin-react';
import eslintReactHooks from 'eslint-plugin-react-hooks';
import eslintReactRefresh from 'eslint-plugin-react-refresh';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

// Historical oversized files are kept under a no-growth limit while they are
// refactored into modules. New files retain the strict 124-line limit.
// Remove each entry when its corresponding source file is split.
const legacyLineBaselines = {
  'src/components/blood-requests/component-request-form.tsx': 229,
  'src/components/blood-requests/component-request-return.test.tsx': 293,
  'src/components/blood-requests/component-request.tsx': 858,
  'src/components/blood-requests/individual-selection-component-modal.tsx': 276,
  'src/components/blood-requests/individual-selection-direction.tsx': 1136,
  'src/components/modal/use-modal-auto-height.ts': 175,
  'src/components/saved-document/working-form-cleanup.test.ts': 129,
  'src/components/transfusion-protocol/compatibility-tests-fields.tsx': 162,
  'src/components/transfusion-protocol/donor-component-editor.test.tsx': 173,
  'src/components/transfusion-protocol/editor-config-first-page.ts': 192,
  'src/components/transfusion-protocol/first-page-blocks-secondary.tsx': 235,
  'src/components/transfusion-protocol/protocol-editor-modal.tsx': 201,
  'src/components/transfusion-protocol/protocol-field-control.tsx': 155,
  'src/components/transfusion-protocol/protocol-toolbar.test.tsx': 237,
  'src/components/transfusion-protocol/protocol-toolbar.tsx': 164,
  'src/components/transfusion-protocol/recipient-database-modal.tsx': 451,
  'src/components/transfusion-protocol/recipient-history-fields.tsx': 188,
  'src/components/transfusion-protocol/recipient-history-panel.test.tsx': 149,
  'src/components/transfusion-protocol/recipient-history-panel.tsx': 236,
  'src/components/transfusion-protocol/saved-options-field.tsx': 185,
  'src/components/transfusion-protocol/second-page-blocks.tsx': 249,
  'src/components/transfusion-protocol/transfusion-protocol.tsx': 318,
  'src/components/transfusion-protocol/use-protocol-draft.ts': 151,
  'src/components/transfusion-protocol/use-protocol-workspace.test.ts': 296,
  'src/components/transfusion-protocol/use-protocol-workspace.ts': 434,
  'src/components/transfusion-registration/registration-transfusions-modal.tsx': 171,
  'src/components/transfusion-registration/transfusion-registration.tsx': 607,
  'src/storage/repositories/current-indications.ts': 200,
  'src/storage/repositories/current-recipient.test.ts': 295,
  'src/storage/repositories/current-recipient.ts': 572,
  'src/storage/repositories/recipient-deletion.ts': 132,
  'src/storage/repositories/request-drafts.test.ts': 129,
  'src/storage/sqlite/database-client.test.ts': 149,
  'src/storage/sqlite/database.worker.ts': 187,
  'src/storage/sqlite/form-record-store.test.ts': 239,
  'src/storage/sqlite/form-record-store.ts': 137,
  'src/storage/sqlite/recipient-store.ts': 151,
  'src/storage/sqlite/record-editing.test.ts': 146,
  'src/storage/sqlite/record-storage.test.ts': 229,
};

export default tseslint.config(
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: eslintReact,
      'react-hooks': eslintReactHooks,
      'react-refresh': eslintReactRefresh,
      prettier: prettierPlugin,
    },
  },
  {
    ignores: ['dist', 'node_modules', 'coverage', 'eslint.config.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
      parserOptions: {
        project: ['tsconfig.json', 'tsconfig.node.json'],
      },
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      parserOptions: { project: null },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...eslintReactHooks.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'prefer-const': 'error',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/function-component-definition': ['warn', { namedComponents: 'arrow-function' }],
      'react/self-closing-comp': ['error', { component: true, html: true }],
      'max-lines': ['warn', { max: 124 }],
      'max-params': ['error', 3],
    },
  },
  ...Object.entries(legacyLineBaselines).map(([file, max]) => ({
    files: [file],
    rules: {
      'max-lines': ['warn', { max }],
    },
  }))
);
