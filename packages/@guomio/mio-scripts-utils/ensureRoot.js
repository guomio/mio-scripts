const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

/**
 * 确保执行目录正确，否则将退出程序
 */
module.exports = function ensureRoot(cwd = process.cwd()) {
  const package = path.resolve(cwd, 'package.json');
  if (!fs.existsSync(package)) {
    console.log(chalk.redBright.bold(`\n${package} 不存在，请确认执行目录.`));
    process.exit(1);
  }
};
