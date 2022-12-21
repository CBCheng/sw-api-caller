module.exports = {
  root: true,
  env: {
    node: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  extends: ['eslint:recommended'],
  plugins: ['import'],
  ignorePatterns: ['index.html', 'dist/*'],
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    sessionStorage: 'readonly',
    window: 'readonly',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    // eslint
    semi: ['error', 'never'],
    'prefer-const': 1,
    'prefer-template': 1,
    'function-paren-newline': 'off',
    'implicit-arrow-linebreak': 'off',
    'linebreak-style': 'off',
    'arrow-parens': ['error', 'as-needed'],
    'no-bitwise': ['error', { int32Hint: true, allow: ['|', '&'] }],
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': 'off',
    'object-curly-newline': 'off',
    'no-shadow': ['error', { allow: ['state'] }],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreTemplateLiterals: true,
        ignoreStrings: true,
        ignoreUrls: true,
        ignoreRegExpLiterals: true,
      },
    ],
    'operator-linebreak': 'off',
    camelcase: [
      'error',
      {
        allow: [
          'Access_Token',
          'access_token',
          'Refresh_Token',
          'refresh_token',
          'expires_in',
          'Client_Id',
          'client_id',
        ],
      },
    ],
    'import/no-cycle': ['error', { maxDepth: 1 }],
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'sort-imports': [
      'error',
      {
        ignoreDeclarationSort: true,
      },
    ],
    'no-param-reassign': ['error', { props: false }],
    'spaced-comment': ['error', 'always'],
    'object-shorthand': 'error',
  },
}
