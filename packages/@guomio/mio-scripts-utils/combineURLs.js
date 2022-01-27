/**
 * 拼接url地址
 * @param {string} baseURL 根地址
 * @param {string[]} relativeURL 要拼接的地址
 */
const combineURLs = (baseURL, ...relativeURL) => {
  const trimRight = p => (p + '').replace(/\/+$/, '');
  const trimLeft = p => (p + '').replace(/^\/+/, '');
  const paths = baseURL ? [trimRight(baseURL)] : [];
  relativeURL.forEach(p => {
    if (p) {
      paths.push(trimRight(trimLeft(p)));
    }
  });
  return paths
    .join('/')
    .replace(/\/\?/, '?')
    .replace(/=\//g, '=');
};

module.exports = combineURLs;
