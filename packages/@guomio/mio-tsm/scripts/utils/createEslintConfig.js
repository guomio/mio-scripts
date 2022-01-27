'use strict';

const chalk = require('@guomio/mio-scripts-utils/chalk');
const baseConfig = require('@guomio/mio-eslint-config');
const paths = require('../../config/paths');

/**
 * eslint config
 * @param {import('eslint').ESLint.Options} opts
 */
module.exports = (opts) => {
  /**
   * @type {import('eslint').ESLint.Options}
   */
  const config = {
    baseConfig,
    errorOnUnmatchedPattern: false,
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    cwd: paths.appSrc,
    ...opts,
  };
  const overrides = Object.assign({}, require(paths.appPackageJson).eslintConfig);

  const supportedKeys = [
    'extends',
    'globals',
    'env',
    'noInlineConfig',
    'overrides',
    'parser',
    'parserOptions',
    'ignorePatterns',
    'plugins',
    'processor',
    'reportUnusedDisableDirectives',
    'settings',
    'rules',
  ];
  if (overrides) {
    supportedKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(overrides, key)) {
        if (Array.isArray(config.baseConfig[key]) || typeof config.baseConfig[key] !== 'object') {
          // for arrays or primitive types, directly override the config.baseConfig key
          config.baseConfig[key] = overrides[key];
        } else {
          // for object types, extend gracefully
          config.baseConfig[key] = Object.assign({}, config.baseConfig[key], overrides[key]);
        }

        delete overrides[key];
      }
    });
    const unsupportedKeys = Object.keys(overrides);
    if (unsupportedKeys.length) {
      console.error(
        chalk.red(
          '\nOut of the box, TSM only supports overriding ' +
            'these eslintConfig options:\n\n' +
            supportedKeys.map((key) => chalk.bold('  \u2022 ' + key)).join('\n') +
            '.\n\n' +
            'These options in your package.json eslintConfig configuration ' +
            'are not currently supported by TSM:\n\n' +
            unsupportedKeys.map((key) => chalk.bold('  \u2022 ' + key)).join('\n'),
        ),
      );
      process.exit(1);
    }
  }
  return config;
};
