const fs = require('fs');
const path = require('path');

/**
 * 获取项目信息
 * @param {string} rootPath 根路径
 * @param {string} dirPath 项目路径
 * @returns {Promise<{value: string; name: string} | false>}
 */
exports.loadPackage = function (rootPath, dirPath) {
  return new Promise((resolve) => {
    const value = path.join(rootPath, dirPath);
    const name = value.replace(/.*\/(.*)$/g, '$1');
    try {
      const description = require(path.join(value, 'package.json')).description;
      resolve({ value, name: description ? `${name} (${description})` : name });
    } catch (err) {
      resolve(false);
    }
  });
};

/**
 * 获取文件夹下选择项，去除以 \.|_ 开头的文件
 * @param {string} dir 文件夹目录
 * @returns {Promise<{name: string; value: string}[]>}
 */
module.exports = async function genPromptChoices(dir) {
  const projects =
    fs
      .readdirSync(dir)
      .filter((k) => !k.startsWith('_'))
      .filter((k) => !k.startsWith('.')) || [];
  return projects.length
    ? (await Promise.all(projects.map((k) => exports.loadPackage(dir, k)))).filter(Boolean)
    : [];
};
