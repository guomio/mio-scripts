'use strict';

const chalk = require('@guomio/mio-scripts-utils/chalk');
const createPm2Config = require('./utils/createPm2Config');

/**
 * stop
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
  try {
    const pm2 = require('pm2');
    pm2.connect((err) => {
      if (err) {
        console.error(err);
        process.exit(2);
      }
      const config = createPm2Config();
      pm2.list((err, list) => {
        const instance = list.find((l) => l.name === config.name);
        if (!instance) {
          console.log(`App ${chalk.green.bold(config.name)} not found.`);
          pm2.disconnect();
          if (err) throw err;
          return;
        }
        pm2.stop(config.name, (err) => {
          pm2.disconnect();
          if (err) throw err;
          console.log(`App ${chalk.green.bold(config.name)} successfully stopped.`);
        });
      });
    });
  } catch (err) {
    console.log(chalk.red('pm2 stop error: ') + err);
  }
};
