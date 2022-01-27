'use strict';

const ts = require('typescript');
const chalk = require('@guomio/mio-scripts-utils/chalk');
const checkRequiredFiles = require('@guomio/mio-scripts-utils/checkRequiredFiles');
const codeFrame = require('@babel/code-frame').codeFrameColumns;
const fs = require('fs');
const dayjs = require('dayjs');

/**
 * @type {ts.FormatDiagnosticsHost}
 */
const formatHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

/**
 * dev
 * @param {string} root
 * @param {object} opts
 * @param {string} opts.env
 * @param {boolean} opts.run
 */
module.exports = function (opts) {
  process.env.NODE_ENV = 'development';
  if (opts.env) {
    process.env.ENV_MODE = opts.env;
  }
  require('../config/env');
  require('./utils/verifyTypeScriptSetup')();
  const paths = require('../config/paths');
  if (!checkRequiredFiles([paths.appIndexJs])) {
    process.exit(1);
  }
  /**
   * @returns {Promise<string>}
   */
  function build() {
    /**
     * @param {ts.Diagnostic} diagnostic
     */
    function reportDiagnostic(diagnostic) {
      const { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start,
      );
      const frame = codeFrame(
        diagnostic.file.text,
        { start: { line: line + 1, column: character + 1 } },
        {
          highlightCode: true,
        },
      );
      const filepath = diagnostic.file.fileName.replace(paths.appPath, '.');
      console.log(filepath);
      console.log(
        chalk.red('[ERR]'),
        ts.flattenDiagnosticMessageText(diagnostic.messageText, host.getNewLine()),
      );
      console.log(frame);
    }

    /**
     * @param {ts.Diagnostic} diagnostic
     */
    function reportWatchStatusChanged(diagnostic) {
      bootNodemon(ts.formatDiagnostic(diagnostic, formatHost));
    }
    const host = ts.createWatchCompilerHost(
      paths.appTsConfig,
      { noEmit: false, declaration: true, declarationDir: paths.appBuild, outDir: paths.appBuild },
      ts.sys,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram,
      reportDiagnostic,
      reportWatchStatusChanged,
    );
    copyPublicFolder();
    const watch = ts.createWatchProgram(host);
    ['SIGINT', 'SIGTERM'].forEach(function (sig) {
      process.on(sig, function () {
        watch.close();
      });
    });
  }
  /**
   * @type {import('nodemon')}
   */
  let nodemon;

  /**
   * @param {string[]} message
   */
  function bootNodemon(...message) {
    console.log(chalk.cyan(`[${dayjs().format('HH:mm:ss')}]`), ...message);
    if (opts.run && !nodemon) {
      if (!fs.existsSync(paths.appBuild)) {
        fs.mkdirSync(paths.appBuild);
      }
      nodemon = require('nodemon');
      const createNodemonConfig = require('./utils/createNodemonConfig');
      nodemon(
        createNodemonConfig({
          restartable: false,
          cwd: paths.appBuild,
          env: {
            NODE_OPTIONS: '--enable-source-maps',
          },
        }),
      );
      ['SIGINT', 'SIGTERM'].forEach(function (sig) {
        process.on(sig, function () {
          nodemon.emit('quit');
          process.exit();
        });
      });

      if (process.env.CI !== 'true') {
        process.stdin.on('end', function () {
          nodemon.emit('quit');
          process.exit();
        });
      }
    }
  }

  build();
};

function copyPublicFolder() {
  const paths = require('../config/paths');
  if (!fs.existsSync(paths.appPublic)) return;
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
  });
}
