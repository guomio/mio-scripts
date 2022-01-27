#!/usr/bin/env node
'use strict';

const commander = require('@guomio/mio-scripts-utils/commander');
const chalk = require('@guomio/mio-scripts-utils/chalk');

commander.version(require('../package.json').version).usage('<command> [options]');

commander
  .command('create <name>')
  .description(chalk.cyan('创建项目'))
  .option('-g, --git <url>', `${chalk.cyan('模板git地址')}\t默认为空，可通过交互选择`)
  .option('-t, --type [type]', `${chalk.cyan('模板类型')} \tbranch/tag/commit`)
  .option('-v, --value [value]', `${chalk.cyan('模板值')}\t\t与-t, --type参数对应`)
  .option(
    '-w, --workspace [workspace]',
    `${chalk.cyan('工作空间')} \t在lerna工作空间内创建项目，e.g: packages`,
  )
  .action(require('../lib/create'));

commander
  .command('config <method> [values...]')
  .description(chalk.cyan('配置管理'))
  .action(require('../lib/config'));

commander
  .command('script <method> [args...]')
  .allowUnknownOption()
  .description(chalk.cyan('启动mio-scripts命令'))
  .option('--bin <bin>', '运行程序')
  .option('--cwd <cwd>', '运行路径')
  .action(require('../lib/script'));

commander.on('--help', () => {
  console.log();
  console.log(`  Run ${chalk.yellow(`mio <command> --help`)} for detailed usage of given command.`);
  console.log();
});

commander.parse(process.argv);
