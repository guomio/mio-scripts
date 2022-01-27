'use strict';

const path = require('path');
const fs = require('@guomio/mio-scripts-utils/fsExtra');
const selectExactPath = require('@guomio/mio-scripts-utils/selectExactPath');
const zip = require('@guomio/mio-scripts-utils/zip');

/**
 * 发布测试
 * @param {string} name
 * @param {object} options
 */
async function commit(name, options) {
  const dir = await selectExactPath(name, '请选择要打包zip的项目');

  const build = path.join(dir, 'build');
  if (!fs.existsSync(build)) {
    console.log('资源文件不存在: ' + build);
    console.log('请先执行 mio-scripts build');
    process.exit(1);
  }
  const buildZip = build + '.zip';
  fs.removeSync(buildZip);
  await zip(build, buildZip);
}

module.exports = commit;
