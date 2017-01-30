module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  extends: 'standard',
  // required to lint *.vue files
  plugins: [
    'html'
  ],
  // add your custom rules here
  'rules': {
    // space before functions params list ;
    'space-before-function-paren': 0,
    // allow useless escaping ;
    'no-useless-escape': 0,
    // allow trailing spaces ;
    'no-trailing-spaces': 0,
    // allow semicolon ;
    'semi': 0,
    // allow underscore naming
    'camelcase': 0,
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  },
  'env': {
    'browser': true,
    'node': true
  }
}
