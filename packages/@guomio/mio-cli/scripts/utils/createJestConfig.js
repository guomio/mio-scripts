'use strict';

const fs = require('fs');
const chalk = require('@guomio/mio-scripts-utils/chalk');
const paths = require('../../config/paths');
const modules = require('../../config/modules');

module.exports = (resolve, rootDir) => {
  // Use this instead of `paths.testsSetup` to avoid putting
  // an absolute filename into configuration after ejecting.
  const setupTestsMatches = paths.testsSetup.match(/src[/\\]setupTests\.(.+)/);
  const setupTestsFileExtension = (setupTestsMatches && setupTestsMatches[1]) || 'js';
  const setupTestsFile = fs.existsSync(paths.testsSetup)
    ? `<rootDir>/src/setupTests.${setupTestsFileExtension}`
    : undefined;

  /**
   * @type {import('@jest/types').Config.InitialOptions}
   */
  const config = {
    roots: ['<rootDir>/src'],

    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
    passWithNoTests: true,
    setupFilesAfterEnv: setupTestsFile ? [setupTestsFile] : [],
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
      '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
    ],
    testRunner: require.resolve('jest-circus/runner'),
    transform: {
      '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': require.resolve('esbuild-jest'),
    },

    transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx|mjs|cjs|ts|tsx)$'],
    modulePaths: modules.additionalModulePaths || [],
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|md|txt)$':
        '<rootDir>/mocks/file.js',
      ...(modules.jestAliases || {}),
    },
    moduleFileExtensions: [...paths.moduleFileExtensions, 'node'].filter(
      (ext) => !ext.includes('mjs'),
    ),
    watchPlugins: [
      require.resolve('jest-watch-typeahead/filename'),
      require.resolve('jest-watch-typeahead/testname'),
    ],
    resetMocks: true,
  };
  if (rootDir) {
    config.rootDir = rootDir;
  }
  const overrides = Object.assign({}, require(paths.appPackageJson).jest);
  const supportedKeys = [
    'clearMocks',
    'collectCoverageFrom',
    'coveragePathIgnorePatterns',
    'coverageReporters',
    'coverageThreshold',
    'displayName',
    'extraGlobals',
    'globalSetup',
    'globalTeardown',
    'moduleNameMapper',
    'resetMocks',
    'resetModules',
    'restoreMocks',
    'snapshotSerializers',
    'testMatch',
    'transform',
    'transformIgnorePatterns',
    'watchPathIgnorePatterns',
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
      const isOverridingSetupFile = unsupportedKeys.indexOf('setupFilesAfterEnv') > -1;

      if (isOverridingSetupFile) {
        console.error(
          chalk.red(
            'We detected ' +
              chalk.bold('setupFilesAfterEnv') +
              ' in your package.json.\n\n' +
              'Remove it from Jest configuration, and put the initialization code in ' +
              chalk.bold('src/setupTests.js') +
              '.\nThis file will be loaded automatically.\n',
          ),
        );
      } else {
        console.error(
          chalk.red(
            '\nOut of the box, mio-cli only supports overriding ' +
              'these Jest options:\n\n' +
              supportedKeys.map((key) => chalk.bold('  \u2022 ' + key)).join('\n') +
              '.\n\n' +
              'These options in your package.json Jest configuration ' +
              'are not currently supported by TSM:\n\n' +
              unsupportedKeys.map((key) => chalk.bold('  \u2022 ' + key)).join('\n'),
          ),
        );
      }

      process.exit(1);
    }
  }
  return config;
};
