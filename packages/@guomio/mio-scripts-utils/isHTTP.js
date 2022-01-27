/**
 * 判断输入是否是 http 链接
 * @param {*} s
 */
const isHTTP = s => /^http[s]?.*/.test(s || '') || /^\/\//.test(s || '');

module.exports = isHTTP;
