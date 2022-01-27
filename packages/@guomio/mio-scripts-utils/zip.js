const fs = require('fs');
const archiver = require('archiver');
const chalk = require('chalk');

/**
 *
 * @param {string} dir
 * @param {string} target
 * @returns {Promise<void>}
 */
module.exports = function zip(dir, target) {
  return new Promise(async (resolve) => {
    const output = fs.createWriteStream(target);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });
    archive.on('error', (err) => {
      console.log('Build zip with errors: ', chalk.red(err));
      resolve(false);
    });
    archive.on('finish', () => {
      console.log(
        'Build at',
        chalk.green(target),
        (archive.pointer() / 1024 / 1024).toFixed(2) + ' MB',
      );
      resolve(true);
    });

    archive.pipe(output);

    archive.directory(dir, false);
    await archive.finalize();
  });
};
