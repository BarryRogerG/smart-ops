import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow 'any' type in catch blocks (common pattern for error handling)
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow missing dependencies in useEffect when intentional
      'react-hooks/exhaustive-deps': 'warn',
      // Allow unnecessary try/catch if it's for error transformation
      'no-useless-catch': 'warn',
      // Allow exporting non-components from context files (common pattern)
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['useAuth'] },
      ],
      // Disable the set-state-in-effect rule (it's too strict for form initialization patterns)
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
