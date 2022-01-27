const {
  override,
  addLessLoader,
  addWebpackAlias,
  addBabelPreset,
  addBabelPresets,
  addBabelPlugin,
  addBabelPlugins,
  getBabelLoader,
  addWebpackPlugin,
  useBabelRc,
} = require('customize-cra');
const fs = require('fs');
const path = require('path');
const paths = require('./paths');
const semver = require('semver');
const chalk = require('@guomio/mio-scripts-utils/chalk');

const HtmlWebpackInlinePlugin = require('../plugin/html-webpack-inline-plugin');

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
    babelLoaderFilter = (rule) => {
      return (
        (rule.loader && rule.loader.includes(loaderName)) ||
        (rule.type && rule.type.includes(loaderName) && rule.exclude)
      );
    };
  } else {
    babelLoaderFilter = (rule) =>
      (rule.loader && rule.loader.includes(loaderName)) ||
      (rule.type && rule.type.includes(loaderName) && rule.include);
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

const useBabelConfig = () => (config) => {
  getBabelLoader(config).options.configFile = true;
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
const addMioScriptsModule = () => (config) => {
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
 * 添加全局 sass 变量
 * @param {string} resources
 * @param {RegExp[]} regexps
 * @return {import('customize-cra').OverrideFunc}
 */
const addSassResource =
  (resources, regexps = []) =>
  (config) => {
    if (!fs.existsSync(resources)) {
      return config;
    }
    const addUse = (regexp) => {
      const rule = getRuleByTestRegExp(config, regexp);
      if (!rule || !rule.use) return;
      const resource = {
        loader: require.resolve('sass-resources-loader'),
        options: { resources },
      };
      if (Array.isArray(rule.use)) {
        rule.use.push(resource);
      } else {
        rule.use = [rule.use, resource];
      }
    };
    regexps.forEach(addUse);
    return config;
  };

/**
 * 打包去除 console
 * @return {import('customize-cra').OverrideFunc}
 */
const addDropConsole = () => (config) => {
  if (process.env.DROP_CONSOLE !== 'true') {
    return config;
  }
  config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true;
  return config;
};

/**
 * 添加 eruda 调试工具
 * @return {import('customize-cra').OverrideFunc}
 */
const addEruda = () => (config) => {
  if (process.env.INJECT_TOOL !== 'true') {
    return config;
  }
  addWebpackPlugin(
    new HtmlWebpackInlinePlugin([
      {
        position: 'headTop',
        attributes: {
          src: 'https://cdn.bootcdn.net/ajax/libs/eruda/2.4.1/eruda.min.js',
        },
        tagName: 'script',
      },
      {
        position: 'headTop',
        innerHTML: '!(function() {if (window.eruda) {window.eruda.init();}})();',
        tagName: 'script',
      },
    ]),
  )(config);
  return config;
};

/**
 * 支持 vue 构建
 * @param {string} packageJson
 * @return {import('customize-cra').OverrideFunc}
 */
const addVueSupport = (appPath) => (config) => {
  const packageJson = path.join(appPath, 'package.json');
  if (!fs.existsSync(packageJson)) {
    return config;
  }
  const appPackageJson = require(packageJson);
  const vue = Object.assign({}, appPackageJson.dependencies, appPackageJson.devDependencies).vue;
  if (!vue) {
    return config;
  }
  const vueMajor = semver.major(vue.replace(/^[^0-9]/, ''));
  const vueRegExp = /\.vue$/;
  config.module.noParse = /^(vue|vue-router|vuex|vuex-router-sync)$/;
  const fileLoader = getLoader(config, 'asset/resource', true);
  fileLoader.exclude.push(vueRegExp);
  // 删除 React babel 配置
  const babelLoader = getBabelLoader(config);
  delete babelLoader.options.customize;
  babelLoader.options.presets = [];
  babelLoader.options.plugins = [];
  addBabelPresets(
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {
          browsers: [
            'last 2 versions',
            'Firefox ESR',
            '> 1%',
            'ie >= 11',
            'iOS >= 8',
            'Android >= 4',
          ],
        },
      },
    ],
    require.resolve('@babel/preset-typescript'),
  ).forEach((cb) => cb(config));
  // 需要第一个引入，后续顺序也需要注意
  addBabelPlugin(require.resolve('@babel/plugin-transform-typescript'))(config);
  if (vueMajor === 2) {
    addBabelPlugin(require.resolve('babel-plugin-transform-vue-jsx'))(config);
  }
  addBabelPlugins(
    [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
    [require.resolve('@vue/babel-plugin-jsx'), { mergeProps: false }],
    require.resolve('@babel/plugin-proposal-optional-chaining'),
    require.resolve('@babel/plugin-transform-object-assign'),
    require.resolve('@babel/plugin-proposal-object-rest-spread'),
    require.resolve('@babel/plugin-proposal-export-default-from'),
    require.resolve('@babel/plugin-proposal-export-namespace-from'),
    require.resolve('@babel/plugin-proposal-class-properties'),
  ).forEach((cb) => cb(config));
  if (vueMajor === 3) {
    addWebpackAlias({
      '@': path.join(appPath, 'src'),
      vue$: 'vue/dist/vue.runtime.esm-bundler.js',
    })(config);
    const vueRule = {
      test: vueRegExp,
      include: path.join(appPath, 'src'),
      use: [
        require.resolve('cache-loader'),
        {
          loader: require.resolve('vue-loader'),
          options: {
            babelParserPlugins: ['jsx', 'classProperties', 'decorators-legacy'],
          },
        },
      ],
    };
    config.module.rules.unshift(vueRule);
    const VueLoaderPlugin = require('vue-loader/dist/plugin').default;
    config.plugins.unshift(new VueLoaderPlugin());
    const DefinePlugin = require('webpack').DefinePlugin;
    config.plugins.push(
      new DefinePlugin({
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
      }),
    );
  }
  if (vueMajor === 2) {
    let compiler;
    try {
      compiler = require(require.resolve('vue-template-compiler/build', {
        paths: [paths.appPath],
      }));
    } catch (err) {
      console.log(`Cannot find module ${chalk.yellow('vue-template-compiler')}\n`);
      console.log(`- Please try commands:`);
      console.log(` - pnpm add vue-template-compiler@${vue} -D`);
      console.log(` - yarn add vue-template-compiler@${vue} -D`);
      console.log(` - npm i vue-template-compiler@${vue} --save-dev\n`);
      process.exit(1);
    }
    addWebpackAlias({
      '@': path.join(appPath, 'src'),
      vue$: 'vue/dist/vue.runtime.esm.js',
    })(config);
    const vueRule = {
      test: vueRegExp,
      include: path.join(appPath, 'src'),
      use: [
        require.resolve('cache-loader'),
        {
          loader: require.resolve('vue-loader-v15'),
          options: {
            // 跳过 vue2 版本检查
            compiler,
            compilerOptions: {
              whitespace: 'condense',
            },
          },
        },
      ],
    };
    config.module.rules.unshift(vueRule);
    const VueLoaderPlugin = require('vue-loader-v15/lib/plugin');
    config.plugins.unshift(new VueLoaderPlugin());
  }

  const eslintPlugin = getEslintPlugin(config);
  eslintPlugin.options.baseConfig = {
    extends: [
      'plugin:vue/essential',
      'eslint:recommended',
      require.resolve('@vue/eslint-config-typescript/recommended'),
    ],
  };
  eslintPlugin.options.useEslintrc = true;
  eslintPlugin.options.overrideConfig = {
    ...eslintPlugin.options.overrideConfig,
    parserOptions: {
      parser: require.resolve('@typescript-eslint/parser'),
      sourceType: 'module',
      ecmaVersion: 2020,
    },
    rules: {
      'no-async-promise-executor': 0,
      'no-var': 0,
      'no-case-declarations': 0,
      '@typescript-eslint/no-empty-interface': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      'prefer-const': 1,
      '@typescript-eslint/no-inferrable-types': 1,
      '@typescript-eslint/no-var-requires': 1,
      '@typescript-eslint/no-extra-semi': 1,
      '@typescript-eslint/no-this-alias': 0,
      'no-useless-escape': 1,
      'no-extra-boolean-cast': 0,
      'prefer-rest-params': 0,
      'no-undef': 0,
    },
  };
  return config;
};

/**
 * @param {import('webpack').Configuration} config
 * @param {'development' | 'production' | 'test'} env
 */
function overrides(config, env) {
  return override(
    addVueSupport(paths.appPath),
    addMioScriptsModule(),
    useBabelRc(),
    useBabelConfig(),
    addLessLoader(),
    addDropConsole(),
    addEruda(),
    addBundleVisualizer(),
    addSassResource(path.join(paths.appPath, 'src/styles/var.scss'), [
      /\.(scss|sass)$/,
      /\.module\.(scss|sass)$/,
    ]),
    addSassResource(path.join(paths.appPath, 'src/styles/var.less'), [
      /\.less$/,
      /\.module\.less$/,
    ]),
  )(config);
}

overrides.override = override;
overrides.getRuleByTestRegExp = getRuleByTestRegExp;
overrides.getLoader = getLoader;
overrides.getBabelLoader = getBabelLoader;
overrides.addRule = addRule;
overrides.addWebpackAlias = addWebpackAlias;
overrides.addBabelPreset = addBabelPreset;
overrides.addBabelPresets = addBabelPresets;
overrides.addBabelPlugin = addBabelPlugin;
overrides.addBabelPlugins = addBabelPlugins;
overrides.addWebpackPlugin = addWebpackPlugin;
overrides.addResolveModules = addResolveModules;
overrides.addEslintRules = addEslintRules;
overrides.getEslintPlugin = getEslintPlugin;

module.exports = overrides;
