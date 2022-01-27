const inquirer = require('./inquirer');
const genPromptChoices = require('./genPromptChoices');
const path = require('path');
const fs = require('fs');
const chalk = require('./chalk');

/**
 * 根据用户输入，选择正确的工作路径
 * @param {string} name 用户输入值
 * @param {string} message prompt 提示信息
 * @param {string} cwd 执行路径
 * @returns {Promise<string>}
 */
module.exports = async function selectExactPath(name, message, cwd = process.cwd()) {
  // 指定当前目录时，直接返回执行路径
  if (name === '.' || name === './') {
    return cwd;
  }
  const packagesDir = path.join(cwd, 'packages');
  // 未指定路径
  if (typeof name === 'undefined') {
    // 该项目不包含 packages 工作空间，且包含 package.json，直接返回执行路径
    if (!fs.existsSync(packagesDir) && fs.existsSync(path.join(cwd, 'package.json'))) {
      return cwd;
    }
    name = '';
  }
  // 输入路径精准匹配时，直接返回
  if (name !== '' && fs.existsSync(path.join(cwd, name))) {
    return path.join(cwd, name);
  }

  // 无工作空间，从执行目录搜索
  if (!fs.existsSync(packagesDir)) {
    return await prompt(cwd, name, message);
  }

  const dir = path.join(cwd, 'packages', name);
  // 精准匹配 packages 工作空间中的项目
  if (fs.existsSync(path.join(dir, 'package.json'))) {
    return dir;
  }
  // 未精准匹配，根据 name 开始查询
  return await prompt(packagesDir, name, message);
};

/**
 * @param {string} dir
 * @param {string} name
 * @param {string} message
 */
async function prompt(dir, name, message) {
  const choices = (await genPromptChoices(dir)).filter(
    (c) => c.value.includes(name) || c.name.includes(name),
  );
  if (choices.length === 0) {
    console.log(`${chalk.red('error')} SelectExactPath NotFound: ${name}`);
    return process.exit(1);
  }
  if (choices.length === 1) {
    return choices[0].value;
  }
  const { action } = await inquirer.prompt([
    {
      name: 'action',
      type: 'list',
      message,
      choices,
    },
  ]);
  return action;
}
