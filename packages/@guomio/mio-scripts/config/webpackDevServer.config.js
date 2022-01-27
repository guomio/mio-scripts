const webpackDevServerConfig = require('./webpackDevServer.config.base');
const overrides = require('@guomio/mio-scripts-utils/configOverrides');

module.exports = overrides.devServer(webpackDevServerConfig);
