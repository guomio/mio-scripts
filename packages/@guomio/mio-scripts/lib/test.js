'use strict';

const spawn = require('react-dev-utils/crossSpawn');
const selectExactPath = require('@guomio/mio-scripts-utils/selectExactPath');
const mioConfig = require('@guomio/mio-scripts-utils/mioConfig');
const forceSlash = require('@guomio/mio-scripts-utils/forceSlash');

const args = process.argv.slice(2);

/**
 * 测试项目
 * @param {string} name
 * @param {object} options
 * @param {string} options.env
 * @param {string} options.path
 * @param {string} options.base
 */
module.exports = async function test(name, options) {
  const dir = await selectExactPath(name, '请选择要测试的项目');
  const mio = mioConfig(dir);

  const USE_HISTORY = typeof options.history === 'boolean' ? options.history : mio.history;
  const ROUTE_BASE = forceSlash(options.path || mio.path);

  process.env.PUBLIC_URL = options.base || mio.base || '/';
  process.env.REACT_APP_ROUTE_BASE = ROUTE_BASE;
  process.env.REACT_APP_USE_HISTORY = USE_HISTORY;

  if (options.env) {
    process.env.ENV_MODE = options.env;
  }

  const result = spawn.sync(
    process.execPath,
    [].concat(require.resolve('../scripts/test')).concat(args),
    {
      stdio: 'inherit',
    },
  );
  if (result.signal) {
    if (result.signal === 'SIGKILL') {
      console.log(
        'The build failed because the process exited too early. ' +
          'This probably means the system ran out of memory or someone called ' +
          '`kill -9` on the process.',
      );
    } else if (result.signal === 'SIGTERM') {
      console.log(
        'The build failed because the process exited too early. ' +
          'Someone might have called `kill` or `killall`, or the system could ' +
          'be shutting down.',
      );
    }
    process.exit(1);
  }
  process.exit(result.status);
};
