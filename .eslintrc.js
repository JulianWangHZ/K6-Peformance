module.exports = {
  env: {
    browser: false,
    node: true,
    es2021: true,
    k6: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  globals: {
    'check': 'readonly',
    'group': 'readonly',
    'http': 'readonly',
    'k6': 'readonly',
    'sleep': 'readonly',
    'check': 'readonly',
    'group': 'readonly',
    'http': 'readonly',
    'k6': 'readonly',
    'sleep': 'readonly'
  }
}
