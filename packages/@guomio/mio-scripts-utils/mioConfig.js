const path = require('path');

/**
 * 获取指定 package.json 中 angelina 配置
 * @param {string} dir
 * @returns {{base: string; path: string; history?: boolean}}
 */
module.exports = function mioConfig(dir) {
  try {
    return require(path.join(dir, 'package.json'))['mio'] || {};
  } catch (err) {
    return {};
  }
};
