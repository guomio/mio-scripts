'use strict';

const chalk = require('@guomio/mio-scripts-utils/chalk');
const miorc = require('@guomio/mio-scripts-utils/miorc');

/**
 *
 * @param {string} method
 * @param {string[]} values
 */
async function config(method, values) {
  method = method.toLocaleLowerCase();
  let key = values[0];
  let value = values[1];

  if (key && values.length < 2) {
    const [v, ...vv] = key.split('=');
    key = v;
    value = vv.join('=');
  }
  switch (method) {
    case 'get':
      console.log(miorc.get(key));
      break;
    case 'set':
      miorc.set(key, value);
      break;
    case 'delete':
      miorc.delete(key);
      break;
    default:
      console.log(chalk.red(`Unknow: ${method}`));
      process.exit(1);
  }
}

module.exports = config;
