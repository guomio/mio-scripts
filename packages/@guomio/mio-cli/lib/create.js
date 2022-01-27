'use strict';

const fs = require('@guomio/mio-scripts-utils/fsExtra');
const path = require('path');
const chalk = require('@guomio/mio-scripts-utils/chalk');
const execSync = require('child_process').execSync;
const axios = require('@guomio/mio-scripts-utils/axios');
const inquirer = require('@guomio/mio-scripts-utils/inquirer');
const genAngelinaURL = require('@guomio/mio-scripts-utils/genAngelinaURL');
const flashGuomioVersion = require('@guomio/mio-scripts-utils/flashGuomioVersion');
const writeFileSync = require('@guomio/mio-scripts-utils/writeFileSync');

/**
 * 创建项目
 * @param {string} name
 * @param {object} options
 * @param {string} options.git
 * @param {'branch' | 'tag' | 'commit'} options.type
 * @param {string} options.value
 * @param {string | true} options.workspace
 */
async function create(name, options) {
  options.type = ensureString(options.type, 'branch');
  options.workspace = ensureString(options.workspace, 'packages');
  if (options.type === 'branch') {
    options.value = ensureString(options.value, 'master');
  }

  const cwd = process.cwd();
  const join = (...p) => path.join(cwd, ...p);
  let target = join(name);

  if (
    fs.existsSync(join('package.json')) &&
    join(options.workspace) !== cwd &&
    fs.existsSync(join(options.workspace))
  ) {
    target = join(options.workspace, name);
  }
  if (fs.existsSync(target)) {
    console.log(`${chalk.red('error')} 路径已存在: ${target}`);
    process.exit(1);
  }

  options.git = await genGitURL(options.git);

  fs.mkdirpSync(target);

  const exec = createExecSync({ cwd: target, stdio: 'ignore' });
  try {
    console.log(`\n开始下载...`);
    switch (options.type) {
      case 'branch':
      case 'tag':
        exec(`git clone -q -b ${options.value} ${options.git} .`);
        break;
      case 'commit':
        exec('git init');
        exec(`git remote add origin -f ${options.git}`);
        exec(`git checkout ${options.value}`);
        break;
    }
  } catch (err) {
    fs.removeSync(target);
    console.log(`${chalk.red('error')} ${err}`);
    console.log('\n请尝试手动下载:');
    console.log(`${chalk.cyan('URLs')}: ${options.git}`);
    console.log(`${chalk.cyan('Type')}: ${options.type}`);
    console.log(`${chalk.cyan('Refs')}: ${options.value}`);
    process.exit(1);
  }
  fs.removeSync(path.join(target, '.git'));

  // 修正模板配置
  const packageJsonPath = path.join(target, 'package.json');
  const packageJson = require(packageJsonPath);
  packageJson.name = name;
  console.log(`校验 @guomio/* 组件版本...`);
  flashGuomioVersion(packageJson);
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`\n🎉 创建成功! ${chalk.cyan(target.replace(cwd + '/', ''))}\n`);
}

function ensureString(value, v) {
  return typeof value !== 'string' ? v : value;
}

/**
 * 创建 execSync 实例
 * @param {import('child_process').ExecFileOptions} options
 * @returns {(command: string) => Buffer}
 */
function createExecSync(options) {
  return (command) => {
    execSync(command, options);
  };
}

/**
 * 判断输入地址是否是合法的 gitlab 项目地址
 * @param {string} url
 * @returns {boolean}
 */
function isFullGitURL(url) {
  return [/^https?:\/\//, /^git@/].some((regExp) => regExp.test(url));
}

/**
 * @param {string} url
 * @returns {string}
 */
async function genGitURL(url) {
  if (!url) {
    const res = await axios.get(genAngelinaURL('vars/map/tps'));
    if (res.status === 200 && res.data.data.tps) {
      const { action } = await inquirer.prompt([
        {
          name: 'action',
          type: 'list',
          message: '请选择一个模板:',
          choices: res.data.data.tps,
        },
      ]);
      url = action;
    }
  }
  return url;
}

module.exports = create;
