#!/usr/bin/env node
'use strict';

const commander = require('@guomio/mio-scripts-utils/commander');
const chalk = require('@guomio/mio-scripts-utils/chalk');

commander.version(require('../package.json').version).usage('<command> [options]');

commander
  .command('start')
  .arguments('[path]')
  .option('-t, --tool', `添加eruda调试工具`)
  .option('-e, --env <mode>', `读取.env.{mode}环境变量`)
  .option('-p, --path <path>', `设置subpath`)
  .option('-b, --base <base>', `设置baseURL`)
  .option('--history', '设置router history')
  .option('--preflight-check', '依赖检查')
  .option('-o, --open', 'open browser')
  .usage(`${chalk.green('<path>')}`)
  .description(chalk.cyan('启动本地服务'))
  .action(require('../lib/start'));

commander
  .command('build')
  .arguments('[path]')
  .option('-t, --tool', '添加eruda调试工具')
  .option('-e, --env <mode>', '读取.env.{mode}环境变量')
  .option('-p, --path <path>', '设置subpath')
  .option('-b, --base <base>', `设置baseURL`)
  .option('--preflight-check', '依赖检查')
  .option('--history', '设置router history')
  .option('-s, --sourcemap', '打包sourcemap')
  .option('-d, --dropconsole', '去除console')
  .option('--report', '输出webpack-bundle-analyzer')
  .usage(`${chalk.green('<path>')}`)
  .description(chalk.cyan('编译项目'))
  .action(require('../lib/build'));

commander
  .command('test')
  .arguments('[path]')
  .allowUnknownOption(true)
  .option('-e, --env <mode>', `读取.env.{mode}环境变量`)
  .option('-p, --path <path>', `设置subpath`)
  .option('-b, --base <base>', `设置baseURL`)
  .usage(`${chalk.green('<path>')}`)
  .description(chalk.cyan('测试项目'))
  .action(require('../lib/test'));

commander
  .command('zip')
  .arguments('[path]')
  .usage(`${chalk.green('<path>')}`)
  .description(chalk.cyan('将静态资源打包为zip'))
  .action(require('../lib/zip'));

commander.on('--help', () => {
  console.log();
  console.log(
    `  Run ${chalk.yellow(`mio-scripts <command> --help`)} for detailed usage of given command.`,
  );
  console.log();
});

commander.parse(process.argv);
