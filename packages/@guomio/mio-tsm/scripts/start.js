'use strict';

const chalk = require('@guomio/mio-scripts-utils/chalk');
const createPm2Config = require('./utils/createPm2Config');
const paths = require('../config/paths');

/**
 * start
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
      pm2.start(
        createPm2Config({
          cwd: paths.appBuild,
        }),
        (err, apps) => {
          try {
            if (err) throw err;
            /**
             * @type {import('pm2').Proc}
             */
            const app = apps[0];
            const pm2_env = app.pm2_env;
            log(
              ['ID', app.pm_id || pm2_env.pm_id],
              ['APP', app.name || pm2_env.name],
              ['STATUS', pm2_env.status],
              ['RESTARTS', pm2_env.restart_time],
              ['NODE', pm2_env.env.NODE],
              ['NODE_ENV', pm2_env.env.NODE_ENV],
              ['ENV_MODE', pm2_env.env.ENV_MODE],
              ['PWD', pm2_env.env.PWD],
            );
            console.log(
              `You can type \`${chalk.green.bold(
                'npx pm2 describe ' + (app.name || pm2_env.name),
              )}\` for more information.`,
            );
            pm2.disconnect();
          } catch (error) {
            pm2.disconnect();
            const e = String(Array.isArray(error) ? error[0] : error);
            if (/Script not found/.test(e)) {
              console.log(chalk.red('[tsm] script not found, you should run build first'));
              return;
            }
            console.log(e);
          }
        },
      );
    });
  } catch (err) {
    console.log(chalk.red('[tsm] pm2 start error: ') + err);
  }
};

/**
 * @param  {...[string, string]} logs
 */
function log(...logs) {
  let max = 0;
  logs.forEach((l) => {
    if (l[0].length > max) {
      max = l[0].length;
    }
  });
  max = max + 6;
  console.log(
    chalk.yellow('Running with settings:\n'),
    ...logs.map(
      ([name, value = '<none>']) =>
        chalk.cyan(name + new Array(max - name.length).fill('').join(' ')) + value + '\n',
    ),
  );
}
