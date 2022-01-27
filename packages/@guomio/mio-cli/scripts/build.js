'use strict';

const ts = require('typescript');
const chalk = require('@guomio/mio-scripts-utils/chalk');
const checkRequiredFiles = require('@guomio/mio-scripts-utils/checkRequiredFiles');
const codeFrame = require('@babel/code-frame').codeFrameColumns;
const path = require('path');
const fs = require('fs');

/**
 * build
 * @param {string} root
 * @param {object} opts
 * @param {string} opts.env
 */
module.exports = function (opts) {
  process.env.NODE_ENV = 'production';
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
   * @param {ts.Diagnostic} diagnostic
   */
  function reportDiagnostic(diagnostic) {
    const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
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
      chalk.red('[mio-cli]'),
      ts.flattenDiagnosticMessageText(diagnostic.messageText, ts.sys.newLine),
    );
    console.log(frame);
  }

  /**
   * @type {{ config: { compilerOptions: ts.CompilerOptions } }}
   */
  const { config } = ts.readConfigFile(paths.appTsConfig, ts.sys.readFile);

  config.compilerOptions = Object.assign({}, config.compilerOptions, {
    noEmit: false,
    declaration: true,
    declarationDir: paths.appBuild,
    outDir: paths.appBuild,
  });
  const { options, fileNames, errors } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(paths.appTsConfig),
  );
  copyPublicFolder();
  const program = ts.createProgram({
    options,
    rootNames: fileNames,
    configFileParsingDiagnostics: errors,
  });
  const emitted = program.emit();

  const diagnostics = ts.getPreEmitDiagnostics(program).concat(emitted.diagnostics);
  diagnostics.forEach((diagnostic) => reportDiagnostic(diagnostic));

  const exitCode = emitted.emitSkipped ? 1 : 0;
  process.exit(exitCode);
};

function copyPublicFolder() {
  const paths = require('../config/paths');
  if (!fs.existsSync(paths.appPublic)) return;
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
  });
}
