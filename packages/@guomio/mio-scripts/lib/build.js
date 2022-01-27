'use strict';

const spawn = require('react-dev-utils/crossSpawn');
const selectExactPath = require('@guomio/mio-scripts-utils/selectExactPath');
const mioConfig = require('@guomio/mio-scripts-utils/mioConfig');
const forceSlash = require('@guomio/mio-scripts-utils/forceSlash');

const args = process.argv.slice(2);

/**
 * 构建项目
 * @param {string} name
 * @param {object} options
 * @param {boolean} options.tool
 * @param {string} options.env
 * @param {string} options.path
 * @param {string} options.base
 * @param {boolean} options.history
 * @param {boolean} options.sourcemap
 * @param {boolean} options.dropconsole
 * @param {boolean} options.skip
 * @param {boolean} options.preflightCheck
 * @param {boolean} options.report
 */
module.exports = async function build(name, options) {
  const dir = await selectExactPath(name, '请选择要构建的项目');
  const mio = mioConfig(dir);

  const USE_HISTORY = typeof options.history === 'boolean' ? options.history : mio.history;
  const BASE_NAME = forceSlash(options.path || mio.path);

  process.env.PUBLIC_URL = options.base || mio.base || '/';
  process.env.REACT_APP_ROUTE_BASE = BASE_NAME;
  process.env.REACT_APP_USE_HISTORY = USE_HISTORY;
  process.env.GENERATE_SOURCEMAP = false;
  if (!options.preflightCheck) {
    process.env.SKIP_PREFLIGHT_CHECK = true;
  }
  if (options.report) {
    process.env.WEBPACK_BUNDLE_ANALYZER = true;
  }
  if (options.env) {
    process.env.ENV_MODE = options.env;
  }
  if (options.tool) {
    process.env.INJECT_TOOL = true;
  }
  if (options.sourcemap) {
    process.env.GENERATE_SOURCEMAP = true;
  }
  if (options.dropconsole) {
    process.env.DROP_CONSOLE = true;
  }

  const result = spawn.sync(
    process.execPath,
    [].concat(require.resolve('../scripts/build')).concat(args),
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
