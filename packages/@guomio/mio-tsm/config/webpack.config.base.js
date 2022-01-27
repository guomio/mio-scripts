'use strict';

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const resolve = require('resolve');
const ESLintPlugin = require('eslint-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const paths = require('./paths');
const modules = require('./modules');
const getClientEnvironment = require('./env');
const ModuleScopePlugin = require('@guomio/mio-scripts-utils/ModuleScopePlugin');
const ModuleNotFoundPlugin = require('@guomio/mio-scripts-utils/ModuleNotFoundPlugin');
const WatchMissingNodeModulesPlugin = require('@guomio/mio-scripts-utils/WatchMissingNodeModulesPlugin');
const ForkTsCheckerWebpackPlugin = require('@guomio/mio-scripts-utils/ForkTsCheckerWebpackPlugin');

const createEnvironmentHash = require('./webpack/persistentCache/createEnvironmentHash');

const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
const disableESLintPlugin = process.env.DISABLE_ESLINT_PLUGIN === 'true';
const target = process.env.TSM_TARGET || 'node';
const filename = process.env.TSM_FILENAME || 'index.js';
const useTypeScript = fs.existsSync(paths.appTsConfig);
const shouldUseNodeExternals = process.env.TSM_NODE_EXTERNAL !== 'false';

/**
 * @param {'development' | 'production'} webpackEnv
 * @returns {import('webpack').Configuration}
 */
module.exports = function (webpackEnv) {
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';
  // Variable used for enabling profiling in Production
  // passed into alias object. Uses a flag if passed into the build command
  const isEnvProductionProfile = isEnvProduction && process.argv.includes('--profile');

  const env = getClientEnvironment();
  return {
    target,
    mode: webpackEnv,
    bail: isEnvProduction,
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? 'source-map'
        : false
      : isEnvDevelopment && 'cheap-module-source-map',
    entry: [paths.appIndexJs],
    externals: [shouldUseNodeExternals && nodeExternals()].filter(Boolean),
    externalsPresets: {
      node: true,
    },
    output: {
      path: paths.appBuild,
      pathinfo: isEnvDevelopment,
      filename,
      libraryTarget: 'commonjs2',
      chunkFormat: 'commonjs',
      chunkFilename: isEnvProduction
        ? 'js/[name].[contenthash:8].chunk.js'
        : isEnvDevelopment && 'js/[name].chunk.js',
      assetModuleFilename: 'media/[name].[contenthash:8][ext]',
    },
    cache: {
      type: 'filesystem',
      version: createEnvironmentHash(env.raw),
      cacheDirectory: paths.appWebpackCache,
      store: 'pack',
      buildDependencies: {
        defaultWebpack: ['webpack/lib/'],
        config: [__filename],
        tsconfig: [paths.appTsConfig, paths.appJsConfig].filter((f) => fs.existsSync(f)),
      },
    },
    infrastructureLogging: {
      level: 'none',
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            parse: {
              // We want terser to parse ecma 8 code. However, we don't want it
              // to apply any minification steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              // Disabled because of an issue with Uglify breaking seemingly valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              // Disabled because of an issue with Terser breaking valid code:
              // https://github.com/facebook/create-react-app/issues/5250
              // Pending further investigation:
              // https://github.com/terser-js/terser/issues/120
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            // Added for profiling in devtools
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            output: {
              ecma: 5,
              comments: false,
              // Turned on because emoji and regex is not minified properly using default
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true,
            },
          },
        }),
      ],
    },
    resolve: {
      modules: ['node_modules', paths.appNodeModules].concat(modules.additionalModulePaths || []),
      extensions: paths.moduleFileExtensions
        .map((ext) => `.${ext}`)
        .filter((ext) => useTypeScript || !ext.includes('ts')),
      alias: {
        ...(modules.webpackAliases || {}),
      },
      plugins: [new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson])],
    },
    module: {
      strictExportPresence: true,
      rules: [
        {
          oneOf: [
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: paths.appSrc,
              loader: require.resolve('ts-loader'),
              options: {
                transpileOnly: true,
              },
            },
            {
              // webpacks internal loaders.
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              type: 'asset/resource',
            },
          ],
        },
      ],
    },
    plugins: [
      new ModuleNotFoundPlugin(paths.appPath),
      new webpack.DefinePlugin(env.stringified),
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      isEnvDevelopment && new WatchMissingNodeModulesPlugin(paths.appNodeModules),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
      useTypeScript &&
        new ForkTsCheckerWebpackPlugin({
          async: isEnvDevelopment,
          typescript: {
            typescriptPath: resolve.sync('typescript', {
              basedir: paths.appNodeModules,
            }),
            configOverwrite: {
              compilerOptions: {
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                skipLibCheck: true,
                inlineSourceMap: false,
                declarationMap: false,
                noEmit: true,
                incremental: true,
                tsBuildInfoFile: paths.appTsBuildInfoFile,
              },
            },
            context: paths.appPath,
            diagnosticOptions: {
              syntactic: true,
            },
            mode: 'write-references',
            // profile: true,
          },
          issue: {
            // This one is specifically to match during CI tests,
            // as micromatch doesn't match
            // otherwise.
            include: [{ file: '../**/src/**/*.{ts,tsx}' }, { file: '**/src/**/*.{ts,tsx}' }],
            exclude: [
              { file: '**/src/**/__tests__/**' },
              { file: '**/src/**/?(*.){spec|test}.*' },
              { file: '**/src/setupTests.*' },
            ],
          },
          logger: {
            infrastructure: 'silent',
          },
        }),

      !disableESLintPlugin &&
        new ESLintPlugin({
          extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
          formatter: require.resolve('@guomio/mio-scripts-utils/eslintFormatter'),
          eslintPath: require.resolve('eslint'),
          failOnError: !isEnvDevelopment,
          context: paths.appSrc,
          cache: true,
          cacheLocation: path.resolve(paths.appNodeModules, '.cache/.eslintcache'),
          cwd: paths.appPath,
          resolvePluginsRelativeTo: __dirname,
          baseConfig: {
            extends: [require.resolve('@guomio/mio-eslint-config')],
          },
        }),
    ].filter(Boolean),
    performance: false,
  };
};
