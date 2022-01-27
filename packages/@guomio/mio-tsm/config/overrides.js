const { override, addWebpackAlias, addWebpackPlugin } = require('customize-cra');
const fs = require('fs');
const path = require('path');

/**
 * 通过 test 正则查找 rule
 * @param {import('customize-cra').OverrideFunc} config
 * @param {RegExp} name
 */
const getRuleByTestRegExp = (config, reg) => {
  const ruleFilter = (rule) =>
    Array.isArray(rule.test)
      ? rule.test.find((r) => `${r}` === `${reg}`)
      : `${rule.test}` === `${reg}`;
  return config.module.rules.find((rule) => Array.isArray(rule.oneOf)).oneOf.find(ruleFilter);
};

/**
 * 通过 loader name 查找 rule
 * @param {*} config
 * @param {string} loaderName
 * @param {boolean} isOutsideOfApp
 */
const getLoader = (config, loaderName, isOutsideOfApp) => {
  let babelLoaderFilter;
  if (isOutsideOfApp) {
    babelLoaderFilter = (rule) => rule.loader && rule.loader.includes(loaderName) && rule.exclude;
  } else {
    babelLoaderFilter = (rule) => rule.loader && rule.loader.includes(loaderName) && rule.include;
  }
  let loaders = config.module.rules.find((rule) => Array.isArray(rule.oneOf)).oneOf;
  let babelLoader = loaders.find(babelLoaderFilter);
  if (!babelLoader) {
    loaders = loaders.reduce((ldrs, rule) => ldrs.concat(rule.use || []), []);
    babelLoader = loaders.find(babelLoaderFilter);
  }
  return babelLoader;
};

/**
 * EslintPlugin 实例
 * @returns {{options:import('eslint-webpack-plugin').Options;}}
 */
const getEslintPlugin = (config) => {
  return config.plugins.find((plugin) => plugin.options && plugin.options.eslintPath);
};

/**
 * @param {Record<string, 0 | 1 | 2 | 'off' | 'warn' | 'error'>} rules
 * @return {import('customize-cra').OverrideFunc}
 */
const addEslintRules = (rules) => (config) => {
  const eslintPlugin = getEslintPlugin(config);
  if (!eslintPlugin) {
    return config;
  }
  eslintPlugin.options.baseConfig.rules = {
    ...eslintPlugin.options.baseConfig.rules,
    ...rules,
  };
  return config;
};

const addBundleVisualizer = () => (config) => {
  if (process.env.WEBPACK_BUNDLE_ANALYZER !== 'true') {
    return config;
  }
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
  addWebpackPlugin(
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: '../report.html',
    }),
  )(config);
  return config;
};

/**
 * 添加 webpack resolve module
 * @param {string[]} newModules
 * @return {import('customize-cra').OverrideFunc}
 */
const addResolveModules =
  (...newModules) =>
  (config) => {
    if (config.resolve && config.resolve.modules) {
      config.resolve.modules.push(...newModules);
    }
    return config;
  };

/**
 * 添加 webpack resolve module
 * @return {import('customize-cra').OverrideFunc}
 */
const addTsmScriptsModule = () => (config) => {
  try {
    const p = require.resolve(require('../package.json').name);
    addResolveModules(p.replace('index.js', 'node_modules'))(config);
  } catch (err) {
    addResolveModules(fs.realpathSync(path.resolve(__dirname, '../node_modules')))(config);
  }
  return config;
};

/**
 * @param {*} newRule
 * @return {import('customize-cra').OverrideFunc}
 */
const addRule = (newRule) => (config) => {
  const oneOf = config.module.rules.find((rule) => Array.isArray(rule.oneOf)).oneOf;
  if (Array.isArray(oneOf)) {
    oneOf.push(newRule);
  }
  return config;
};

/**
 * @param {import('webpack').Configuration} config
 * @param {'development' | 'production' | 'test'} env
 */
function overrides(config, env) {
  return override(addTsmScriptsModule(), addBundleVisualizer())(config);
}

overrides.override = override;
overrides.getRuleByTestRegExp = getRuleByTestRegExp;
overrides.getLoader = getLoader;
overrides.addRule = addRule;
overrides.addWebpackAlias = addWebpackAlias;
overrides.addWebpackPlugin = addWebpackPlugin;
overrides.addResolveModules = addResolveModules;
overrides.addEslintRules = addEslintRules;
overrides.getEslintPlugin = getEslintPlugin;

module.exports = overrides;
