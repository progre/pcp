const webpackConfig = require('@progre/webpack-config');

module.exports = (_, argv) => {
  const isProduction = argv.mode === 'production';
  return [
    webpackConfig.server(
      isProduction,
      '.',
      ['index.ts'],
    ),
  ];
};
