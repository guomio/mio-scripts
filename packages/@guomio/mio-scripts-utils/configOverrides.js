const path = require('path');
const fs = require('fs');
const cwd = path.resolve(fs.realpathSync(process.cwd()));
const packageJson = path.resolve(cwd, 'package.json');
const customPath = fs.existsSync(packageJson) ? require(packageJson)['config-overrides-path'] : '';
let configOverrides = customPath ? `${cwd}/${customPath}` : `${cwd}/config-overrides`;
const co_index = process.argv.indexOf('--config-overrides');

if (co_index > -1 && co_index + 1 <= process.argv.length) {
  configOverrides = path.resolve(process.argv[co_index + 1]);
  process.argv.splice(co_index, 2);
}

let override = {};
try {
  override = require(configOverrides);
} catch (err) {
  if (!/Cannot find module/.test(err.toString())) {
    console.log(err);
    process.exit(0);
  }
}

const webpack = typeof override === 'function' ? override : override.webpack;
const devServer =
  override.devServer ||
  (configFunction => (proxy, allowedHost) => configFunction(proxy, allowedHost));
const jest = override.jest || (config => config);

module.exports = {
  webpack,
  devServer,
  jest,
};
