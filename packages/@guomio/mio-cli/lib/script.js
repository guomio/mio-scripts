const selectExactPath = require('@guomio/mio-scripts-utils/selectExactPath');
const execSync = require('child_process').execSync;
const chalk = require('@guomio/mio-scripts-utils/chalk');

const scriptsMethods = ['start', 'build', 'regist', 'commit', 'deploy', 'release'];

/**
 * 运行 mio-scripts 命令
 * @param {string} method
 * @param {string[]} args
 * @param {{cwd:string;bin:string;}} options
 */
async function scripts(method, args, options) {
  if (!scriptsMethods.includes(method)) {
    console.log(`${chalk.red('error')} Unknow method: ${chalk.yellow(method)}`);
    process.exit(1);
  }
  const bin = options.bin || 'yarn';
  const nameIndex = args.findIndex((arg) => !arg.startsWith('-'));
  const name = nameIndex > -1 ? args[nameIndex] : '';
  if (nameIndex > -1) {
    args.splice(nameIndex, 1);
  }
  const cwd = await selectExactPath(name, '请选择项目', options.cwd);
  console.log('Starting... ' + chalk.cyan(cwd));
  try {
    execSync(`${bin} ${method} ${name} ${args.join(' ')}`, {
      stdio: 'inherit',
      cwd,
    });
  } catch (err) {
    if (err.signal) {
      console.log(`\n${chalk.red('exit')} ` + err.signal);
      process.exit(1);
    }
    console.log(err);
    process.exit(1);
  }
}

module.exports = scripts;
