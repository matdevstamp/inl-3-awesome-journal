# Task: ESLint + Prettier Configuration

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-07
- **Status:** In review
- **Assignee:** matdevstamp
- **Tags:** tooling, linting, code-quality, required, gate:2-scaffold
- **Dependencies:** 05-nextjs-tailwind-shadcn.md, 07-typescript-strict-config.md
- **GitHub Issue:** #9 (https://github.com/matdevstamp/inl-3-awesome-journal/issues/9)
- **Estimated Effort:** 2h

## Requirements

- Consistent code style across the team
- Automatic code formatting on save
- Linting rules for React, TypeScript, and Tailwind

The examples below are optional starting points. The team may use an equivalent flat ESLint, Prettier, or formatter setup as long as local and CI behavior is documented and consistent.

## User Stories

- As a contributor, I want automatic formatting and lint checks so that pull requests stay easy to review.
- As a team, we want the same local and CI quality rules so that style problems do not become merge conflicts.
- Pre-commit hooks for code quality
- CI/CD integration for PR checks

## Design

### ESLint Configuration

```javascript
// eslint.config.js (flat config format for ESLint 9+)
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import tailwindcss from 'eslint-plugin-tailwindcss';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '*.config.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'tailwindcss': tailwindcss,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': 'warn',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
```

### Optional Quick Start

```bash
npm install -D eslint @eslint/js typescript-eslint globals prettier
npx eslint --init
npx prettier --write .
```

Prefer a checked-in configuration and a single documented command such as `npm run lint` before opening a pull request.

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Prettier Ignore

```
# .prettierignore
dist
node_modules
*.md
*.json
coverage
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "tailwindCSS.classFunctions": ["cn", "clsx", "cva"],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "csstools.postcss",
    "biomejs.biome"
  ]
}
```

### Pre-commit Hook (Husky + lint-staged)

```json
// package.json (add to existing)
{
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# Setup Husky
npx husky init
# Add pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

## Tasks

- [x] Install ESLint and plugins
- [x] Create eslint.config.js with flat config
- [x] Install Prettier and plugins
- [x] Create .prettierrc configuration
- [x] Create .prettierignore
- [ ] Setup VS Code settings and extensions
- [ ] Install Husky for git hooks
- [ ] Configure lint-staged
- [ ] Create pre-commit hook
- [x] Test linting on existing code
- [x] Add npm scripts for linting

## Done Criteria

- [ ] ESLint runs without errors
- [ ] Prettier formats code correctly
- [ ] VS Code auto-formats on save
- [ ] Pre-commit hooks run linting
- [ ] All team members have same config
- [ ] CI/CD can run lint checks
- [ ] Import sorting works
- [ ] Unused imports are flagged

## Notes

- Use flat config format for ESLint 9+
- The prettier-plugin-tailwindcss automatically sorts Tailwind classes
- Make sure all team members install recommended VS Code extensions
- Consider adding a `npm run lint:fix` script for quick fixes

## ESLint Scripts

```json
{
  "scripts": {
    "lint": "eslint . --ignore-pattern 'node_modules' --ignore-pattern 'dist'",
    "lint:fix": "eslint . --fix --ignore-pattern 'node_modules' --ignore-pattern 'dist'",
    "format": "prettier --write 'src/**/*.{ts,tsx,css,json}'",
    "format:check": "prettier --check 'src/**/*.{ts,tsx,css,json}'"
  }
}
```

## Questions to Resolve

- [ ] Should we use Biome instead of ESLint + Prettier? (faster)
- [ ] Which import sorting order do we prefer?
- [ ] Should we enforce strict TypeScript rules?
