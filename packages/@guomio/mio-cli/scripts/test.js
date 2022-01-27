'use strict';

const jest = require('jest');
const createJestConfig = require('./utils/createJestConfig');
const path = require('path');

/**
 * build
 * @param {string} root
 * @param {object} opts
 * @param {string} opts.env
 */
module.exports = function (opts) {
  process.env.NODE_ENV = 'test';
  if (opts.env) {
    process.env.ENV_MODE = opts.env;
  }
  require('../config/env');
  const paths = require('../config/paths');
  require('./utils/verifyTypeScriptSetup')();
  let argv = process.argv.slice(2);
  argv.push(
    '--config',
    JSON.stringify(
      createJestConfig(
        (relativePath) => path.resolve(__dirname, '..', relativePath),
        paths.appPath,
      ),
    ),
  );
  jest.run(argv);
};
