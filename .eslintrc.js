module.exports = {
  'parser': '@typescript-eslint/parser',
  'files':'src/**.ts',
  'extends': [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  'parserOptions': {
    'sourceType': 'module',
  },
  'plugins': [
    '@typescript-eslint',
  ],
};
