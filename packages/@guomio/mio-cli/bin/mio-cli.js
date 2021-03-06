#!/usr/bin/env node
'use strict';

process.on('unhandledRejection', (err) => {
  throw err;
});

const commander = require('@guomio/mio-scripts-utils/commander');
const chalk = require('@guomio/mio-scripts-utils/chalk');

commander.version(require('../index')).usage('<command> [options]');

commander
  .command('dev')
  .option('-e, --env <mode>', `Load .{mode}.env`)
  .option('-r, --run', 'Run your project with nodemon')
  .description(chalk.cyan('Rebuilds on any change'))
  .action(require('../scripts/dev'));

commander
  .command('build')
  .option('-e, --env <mode>', `Load .{mode}.env`)
  .description(chalk.cyan('Build your project once and exit'))
  .action(require('../scripts/build'));

commander
  .command('test')
  .option('-e, --env <mode>', `Load .{mode}.env`)
  .allowUnknownOption(true)
  .description(chalk.cyan('Run jest test runner'))
  .action(require('../scripts/test'));

commander
  .command('lint')
  .option('-f, --fix', `lint fix`)
  .description(chalk.cyan('Run eslint with Prettier'))
  .action(require('../scripts/lint'));

commander.on('--help', () => {
  console.log();
  console.log(
    `  Run ${chalk.yellow(`mio-cli <command> --help`)} for detailed usage of given command.`,
  );
  console.log();
});

commander.parse(process.argv);
