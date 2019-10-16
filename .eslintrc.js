module.exports = {
  extends: [
    'plugin:react/recommended',
    '@hellomouse/eslint-config'
  ],
  parserOptions: {
    ecmaVersion: 9,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    es6: true,
    node: true
  },
  plugins: [
    'react'
  ]
};
