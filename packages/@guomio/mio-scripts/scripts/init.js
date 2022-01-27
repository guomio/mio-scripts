'use strict';

process.on('unhandledRejection', (err) => {
  throw err;
});

const paths = require('../config/paths');
const path = require('path');
const verifyTypeScriptSetup = require('./utils/verifyTypeScriptSetup');
const chalk = require('@guomio/mio-scripts-utils/chalk');
const os = require('os');

/**
 * @param {'npm' | 'pnpm' | 'yarnpkg'} pkgtool
 */
module.exports = function (pkgtool) {
  verifyTypeScriptSetup();
  const appPackage = require(paths.appPackageJson);

  appPackage.name = path.basename(process.cwd());
  appPackage.version = '0.0.1';
  appPackage.description = appPackage.description || 'sample created by create-mio-app';
  appPackage.scripts = Object.assign(
    {
      start: 'mio-scripts start',
      build: 'mio-scripts build',
      test: 'mio-scripts test',
      zip: 'mio-scripts zip',
    },
    appPackage.scripts,
  );
  fs.writeFileSync(paths.appPackageJson, JSON.stringify(appPackage, null, 2) + os.EOL);

  const useYarn = pkgtool === 'yarnpkg';

  console.log();
  console.log(`Success! Created ${appPackage.name} at ${process.cwd()}`);
  console.log('Inside that directory, you can run several commands:');
  console.log();
  console.log(chalk.cyan(`  ${pkgtool} start`));
  console.log('    Starts the development server.');
  console.log();
  console.log(chalk.cyan(`  ${pkgtool} ${useYarn ? '' : 'run '}build`));
  console.log('    Bundles the app into static files for production.');
  console.log();
  console.log(chalk.cyan(`  ${pkgtool} test`));
  console.log('    Starts the test runner.');
  console.log();
  console.log('We suggest that you begin by typing:');
  console.log();
  console.log(chalk.cyan('  cd'), appPackage.name);
  console.log(`  ${chalk.cyan(`${pkgtool} start`)}`);
  console.log();
  console.log('Happy hacking!');
};
