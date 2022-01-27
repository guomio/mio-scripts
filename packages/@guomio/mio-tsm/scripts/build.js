'use strict';

const fs = require('fs-extra');
const webpack = require('webpack');
const chalk = require('@guomio/mio-scripts-utils/chalk');
const checkRequiredFiles = require('@guomio/mio-scripts-utils/checkRequiredFiles');
const formatWebpackMessages = require('@guomio/mio-scripts-utils/formatWebpackMessages');
const printBuildError = require('@guomio/mio-scripts-utils/printBuildError');

/**
 * build
 * @param {string} root
 * @param {object} opts
 * @param {string} opts.env
 */
module.exports = function (opts) {
  process.env.NODE_ENV = 'production';
  if (opts.env) {
    process.env.ENV_MODE = opts.env;
  }
  require('../config/env');
  const paths = require('../config/paths');
  if (!checkRequiredFiles([paths.appIndexJs])) {
    process.exit(1);
  }
  require('./utils/verifyTypeScriptSetup')();
  const config = require('../config/webpack.config')('production');

  const compiler = webpack(config);
  copyPublicFolder();
  function build() {
    return new Promise((resolve, reject) => {
      console.log(chalk.yellow('Start building...'));
      compiler.run((err, stats) => {
        let messages;
        if (err) {
          if (!err.message) {
            return reject(err);
          }

          let errMessage = err.message;

          messages = formatWebpackMessages({
            errors: [errMessage],
            warnings: [],
          });
        } else {
          messages = formatWebpackMessages(
            stats.toJson({ all: false, warnings: true, errors: true }),
          );
        }
        if (messages.errors.length) {
          // Only keep the first error. Others are often indicative
          // of the same problem, but confuse the reader with noise.
          if (messages.errors.length > 1) {
            messages.errors.length = 1;
          }
          return reject(new Error(messages.errors.join('\n\n')));
        }
        if (
          process.env.CI &&
          (typeof process.env.CI !== 'string' || process.env.CI.toLowerCase() !== 'false') &&
          messages.warnings.length
        ) {
          console.log(
            chalk.yellow(
              '\nTreating warnings as errors because process.env.CI = true.\n' +
                'Most CI servers set it automatically.\n',
            ),
          );
          return reject(new Error(messages.warnings.join('\n\n')));
        }

        const resolveArgs = {
          stats,
          warnings: messages.warnings,
        };

        return resolve(resolveArgs);
      });
    });
  }
  build().then(
    ({ stats, warnings }) => {
      if (warnings.length) {
        console.log(chalk.yellow('Compiled with warnings.\n'));
        console.log(warnings.join('\n\n'));
        console.log(
          '\nSearch for the ' +
            chalk.underline(chalk.yellow('keywords')) +
            ' to learn more about each warning.',
        );
        console.log(
          'To ignore, add ' + chalk.cyan('// eslint-disable-next-line') + ' to the line before.\n',
        );
      } else {
        console.log(chalk.green('Compiled successfully.\n'));
      }
    },
    (err) => {
      const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === 'true';
      if (tscCompileOnError) {
        console.log(
          chalk.yellow(
            'Compiled with the following type errors (you may want to check these before deploying your app):\n',
          ),
        );
        printBuildError(err);
      } else {
        console.log(chalk.red('Failed to compile.\n'));
        printBuildError(err);
        process.exit(1);
      }
    },
  );
};

function copyPublicFolder() {
  const paths = require('../config/paths');
  if (!fs.existsSync(paths.appPublic)) return;
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
  });
}
