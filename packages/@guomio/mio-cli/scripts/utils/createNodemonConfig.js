'use strict';

const paths = require('../../config/paths');
const path = require('path');

/**
 * nodemon config
 * @param {import('nodemon').Settings} opts
 */
module.exports = (opts) => {
  /**
   * @type {import('nodemon').Settings}
   */
  const config = {
    script: path.join(paths.appBuild, 'index.js'),
    ext: 'js',
    watch: path.join(paths.appBuild, '**/*.js'),
    stdin: false,
    ...opts,
  };

  const overrides = Object.assign({}, require(paths.appPackageJson).nodemon);

  const supportedKeys = [
    'env',
    'script',
    'ext',
    'exec',
    'watch',
    'ignore',
    'quiet',
    'verbose',
    'stdin',
    'stdout',
    'runOnChangeOnly',
    'delay',
    'legacyWatch',
    'exitcrash',
    'execMap',
    'events',
    'restartable',
    'args',
    'nodeArgs',
    'scriptPosition',
    'colours',
    'cwd',
    'dump',
    'ignoreRoot',
    'noUpdateNotifier',
    'pollingInterval',
    'signal',
    'spawn',
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
          '\nOut of the box, mio-cli only supports overriding ' +
            'these nodemon options:\n\n' +
            supportedKeys.map((key) => chalk.bold('  \u2022 ' + key)).join('\n') +
            '.\n\n' +
            'These options in your package.json nodemon configuration ' +
            'are not currently supported by tsm-cli:\n\n' +
            unsupportedKeys.map((key) => chalk.bold('  \u2022 ' + key)).join('\n'),
        ),
      );
      process.exit(1);
    }
  }
  return config;
};
