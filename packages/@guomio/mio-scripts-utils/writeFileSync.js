const fs = require('fs');
const os = require('os');

/**
 * 将模板写入文件
 * @param {string} dir 文件路径
 * @param {string} temp 模板字符串
 * @param {boolean} force 对应文件存在时是否覆盖,默认 true
 */
module.exports = function writeFileSync(dir, temp, force = true) {
  if (!force && fs.existsSync(dir)) return;
  fs.writeFileSync(dir, temp + os.EOL);
};
