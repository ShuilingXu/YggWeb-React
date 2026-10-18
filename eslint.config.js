import js from '@eslint/js'
import parser from '@babel/eslint-parser'
export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: { parserOpts: { plugins: ['typescript', 'jsx'] } },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-console': 'error',
    },
  },
]
