/**
 * 确保 '/' 前后均存在
 * @param {string} name
 */
module.exports = function forceSlash(name) {
  if (/^\./.test(name)) return name;
  if ('/' === name) return '/';
  if (!name || typeof name !== 'string') return '';
  return '/' + name.replace(/^\//, '').replace(/\/$/, '') + '/';
};
