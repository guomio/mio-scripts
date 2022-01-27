const webpackConfig = require('./webpack.config.base');
const overrides = require('@guomio/mio-scripts-utils/configOverrides');
const webpackOverrides = require('./overrides');

module.exports = function (webpackEnv) {
  const config = webpackOverrides(webpackConfig(webpackEnv), webpackEnv);
  if (!overrides.webpack) return config;
  return overrides.webpack(config, webpackEnv);
};
