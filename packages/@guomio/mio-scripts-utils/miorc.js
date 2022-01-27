const os = require('os');
const path = require('path');
const writeFileSync = require('./writeFileSync');

const miorcPath = path.join(os.homedir(), '.miorc');

/**
 *  mio 配置
 */
module.exports = {
  /**
   * 获取配置参数
   * @param {'token' | string | undefined} key
   */
  get(key) {
    try {
      const config = require(miorcPath) || {};
      return key ? config[key] : config;
    } catch (err) {
      return key ? '' : {};
    }
  },
  /**
   * 设置配置项
   * @param {'remote'} key 配置项key
   * @param {*} value 配置项value
   */
  set(key, value) {
    const config = this.get();
    config[key] = value;
    writeFileSync(miorcPath, 'module.exports = ' + JSON.stringify(config, null, 2));
  },
  /**
   * 删除配置项
   * @param {string} key
   */
  delete(key) {
    const config = this.get();
    delete config[key];
    writeFileSync(miorcPath, 'module.exports = ' + JSON.stringify(config, null, 2));
  },
};
