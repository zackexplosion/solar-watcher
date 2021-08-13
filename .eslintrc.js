module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
  ],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-console': 'off',
    'import/no-extraneous-dependencies': 'off',
    'consistent-return': 'off',
    'no-func-assign': 'off',
    'prefer-destructuring': 'warn',
    'no-unused-vars': 'warn',
    'no-continue' : 'off',
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': 'off',
    'camelcase': 'off',
    'no-tabs': 'off',
    'max-len': 'off',
    'semi': 'off'
  },
};
