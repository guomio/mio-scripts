'use strict';

const jest = require('jest');
const createJestConfig = require('./utils/createJestConfig');
const path = require('path');
const paths = require('../config/paths');
const verifyTypeScriptSetup = require('./utils/verifyTypeScriptSetup');

verifyTypeScriptSetup();

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
  let argv = process.argv.slice(2);
  argv.push(
    '--config',
    JSON.stringify(
      createJestConfig(
        (relativePath) => path.resolve(__dirname, '..', relativePath),
        path.resolve(paths.appSrc, '..'),
      ),
    ),
  );
  jest.run(argv);
};
