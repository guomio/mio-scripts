const spawn = require('cross-spawn');
const chalk = require('./chalk');

/**
 * 获取一个npm包的版本号
 * @param {string} pkg 包名
 * @param {string} version 默认版本号
 * @param {string} reg 源
 */
module.exports = function getPkgVersion(
  pkg,
  version = '0.0.1',
  reg = 'https://registry.npmjs.org/',
) {
  const result = spawn.sync('npm', ['--registry', reg, 'view', pkg, 'version']);
  const err = result.stderr.toString().trim();
  if (!err) {
    return '^' + result.stdout.toString().trim();
  } else {
    console.log(`\n获取 ${chalk.yellow(pkg)} 版本失败，将使用默认版本 ${chalk.cyan(version)}`);
    return version;
  }
};
