'use strict';

const { ESLint } = require('eslint');
const chalk = require('@guomio/mio-scripts-utils/chalk');
const createEslintConfig = require('./utils/createEslintConfig');
const verifyTypeScriptSetup = require('./utils/verifyTypeScriptSetup');

verifyTypeScriptSetup();

/**
 * lint
 * @param {string} root
 * @param {object} opts
 * @param {boolean} opts.fix
 */
module.exports = async function (opts) {
  const eslint = new ESLint(
    createEslintConfig({
      fix: opts.fix,
    }),
  );

  const result = await eslint.lintFiles(['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx']);
  await ESLint.outputFixes(result);
  const formatter = await eslint.loadFormatter();
  const resultText = formatter.format(result);
  if (resultText) {
    console.log(resultText);
    process.exit(1);
  }
  console.log(chalk.green('Linted successfully.'));
};
