'use strict';

const paths = require('../../config/paths');
const path = require('path');

/**
 * pm2 config
 * @param {import('pm2').StartOptions} opts
 */
module.exports = (opts) => {
  /**
   * @type {import('pm2').StartOptions}
   */
  const config = {
    script: path.join(paths.appBuild, 'index.js'),
    name: require(paths.appPackageJson).name || 'app',
    ...opts,
  };

  const overrides = Object.assign({}, require(paths.appPackageJson).pm2);

  const supportedKeys = [
    'name',
    'script',
    'args',
    'interpreter_args',
    'cwd',
    'output',
    'error',
    'log_date_format',
    'pid',
    'min_uptime',
    'max_restarts',
    'max_memory_restart',
    'wait_ready',
    'kill_timeout',
    'restart_delay',
    'interpreter',
    'exec_mode',
    'instances',
    'merge_logs',
    'watch',
    'force',
    'ignore_watch',
    'cron',
    'execute_command',
    'write',
    'source_map_support',
    'disable_source_map_support',
    'env',
  ];
  if (overrides) {
    supportedKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(overrides, key)) {
        if (Array.isArray(config[key]) || typeof config[key] !== 'object') {
          // for arrays or primitive types, directly override the config key
          config[key] = overrides[key];
        } else {
          // for object types, extend gracefully
          config[key] = Object.assign({}, config[key], overrides[key]);
        }

        delete overrides[key];
      }
    });
    const unsupportedKeys = Object.keys(overrides);
    if (unsupportedKeys.length) {
      console.error(
        chalk.red(
          '\nOut of the box, TSM only supports overriding ' +
          'these pm2 options:\n\n' +
          supportedKeys.map((key) => chalk.bold('  \u2022 ' + key)).join('\n') +
          '.\n\n' +
          'These options in your package.json pm2 configuration ' +
          'are not currently supported by TSM:\n\n' +
          unsupportedKeys.map((key) => chalk.bold('  \u2022 ' + key)).join('\n'),
        ),
      );
      process.exit(1);
    }
  }
  return config;
};
