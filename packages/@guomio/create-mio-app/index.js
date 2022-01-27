#!/usr/bin/env node
'use strict';

const commander = require('commander');
const prompts = require('prompts');
const chalk = require('chalk');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;

function logger(...args) {
  console.log(...args);
}
logger.log = (...args) => {
  console.log(...args);
};
logger.cyan = (...args) => {
  console.log(chalk.cyan(args.join(' ')));
};
logger.error = (...args) => {
  console.log(chalk.red(args.join(' ')));
};
logger.warn = (...args) => {
  console.log(chalk.yellow(args.join(' ')));
};
logger.trace = (...args) => {
  console.log(chalk.gray(args.join(' ')));
};

function executeNodeScript({ cwd, args }, data, source) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [...args, '-e', source, '--', JSON.stringify(data)], {
      cwd,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject({
          command: `node ${args.join(' ')}`,
        });
        return;
      }
      resolve();
    });
  });
}

class BackManager {
  constructor(rootDir) {
    if (rootDir.endsWith('@guomio/create-mio-app')) {
      logger.warn('can not override create-mio-app itself');
      return;
    }
    this.rootDir = rootDir;
  }
  async check() {
    logger.log(this.rootDir);
    if (fs.existsSync(this.rootDir) && fs.readdirSync(this.rootDir).length > 0) {
      const ok = await prompts({
        type: 'confirm',
        name: 'value',
        message: chalk.cyan('provided dir not empty, override it?'),
        initial: false,
      });
      if (!ok.value) return;
      this.shouldBackup = true;
    }
  }
  backup() {
    if (!this.shouldBackup) return;
    const basename = path.basename(this.rootDir);
    logger.trace(chalk.gray(`move ${basename} -> ${basename}.bak`));
    fs.moveSync(this.rootDir, this.rootDir + '.bak');
  }
}

class TemplateManager {
  constructor() {
    const templateDir = path.join(__dirname, 'template');
    const templates = fs
      .readdirSync(templateDir)
      .map((template) => this.readTemplate(path.join(templateDir, template)))
      .filter(Boolean);

    if (!templates.length) {
      logger.error('no template found');
      process.exit(1);
    }
    this.templates = templates;
  }

  readTemplate(value) {
    try {
      const packageJson = fs.readJSONSync(path.join(value, 'package.json'));
      return {
        value,
        title: packageJson.name,
        description: packageJson.description,
        packageJson,
      };
    } catch (err) {
      return undefined;
    }
  }

  async selectTemplate() {
    const template = await prompts({
      type: 'select',
      name: 'value',
      message: chalk.cyan('select a template'),
      choices: this.templates,
    });
    if (!template.value) {
      process.exit(0);
    }
    this.template = template.value;
  }

  copySync(rootDir) {
    fs.copySync(this.template, rootDir);
    const gitignoreFile = path.join(rootDir, 'gitignore');
    if (fs.existsSync(gitignoreFile)) {
      fs.moveSync(gitignoreFile, path.join(rootDir, '.gitignore'));
    }
  }
}

class PackageManager {
  constructor() {
    try {
      this.npm = execSync('npm --version').toString().trim();
    } catch (err) {
      // ignore
    }
    try {
      this.yarnpkg = execSync('yarnpkg --version').toString().trim();
    } catch (err) {
      // ignore
    }
    try {
      this.pnpm = execSync('pnpm --version').toString().trim();
    } catch (err) {
      // ignore
    }
    this.tool = 'npm';
  }
  async selectTools() {
    const choices = [
      this.npm && { value: 'npm', title: 'npm' },
      this.yarnpkg && { value: 'yarnpkg', title: 'yarn' },
      this.pnpm && { value: 'pnpm', title: 'pnpm' },
    ].filter(Boolean);
    if (!choices.length) {
      logger.error('no pkg tool available');
      process.exit(1);
    }
    const tool = await prompts({
      type: 'select',
      name: 'value',
      message: chalk.cyan('select pkg tool'),
      choices: choices,
    });
    if (!tool.value) {
      process.exit(0);
    }
    this.tool = tool.value;
  }

  install(cwd, dependencies = []) {
    return new Promise((resolve, reject) => {
      const args = [];
      switch (this.tool) {
        case 'pnpm':
        case 'npm':
          args.push('install', '--save', '--save-exact', '--loglevel', 'error', ...dependencies);
          break;
        case 'yarnpkg':
          args.push('add', '--exact', ...dependencies);
          break;
        default:
          logger.error('no pkg tool selected');
          process.exit(1);
      }
      const child = spawn(this.tool, args, { stdio: 'inherit', cwd });
      child.on('close', (code) => {
        if (code !== 0) {
          reject({
            command: `${this.tool} ${args.join(' ')}`,
          });
          return;
        }
        resolve();
      });
    });
  }
}

/**
 * @param {string} dir
 * @param {} opts
 */
async function action(dir, opts) {
  const cwd = process.cwd();
  const rootDir = path.join(cwd, dir || '');

  const backup = new BackManager(rootDir);
  const template = new TemplateManager(rootDir);
  const pkgtool = new PackageManager();
  await backup.check();
  await template.selectTemplate();
  await pkgtool.selectTools();

  // all done, start progress
  try {
    backup.backup();
    template.copySync(rootDir);
    await pkgtool.install(rootDir, ['@guomio/mio-scripts']);

    await executeNodeScript(
      {
        cwd: rootDir,
        args: [],
      },
      [pkgtool.tool],
      `require('@guomio/mio-scripts/scripts/init.js').apply(null, JSON.parse(process.argv[1]));`,
    );
  } catch (err) {
    logger.error('@guomio/mio-scripts init error');
    console.log(err);
  }
}

commander
  .version(
    require('./package.json').version,
    '-v, --version',
    chalk.cyan('output the current version'),
  )
  .name('create-mio-app')
  .usage(`${chalk.yellow('<directory>')} [options]`)
  .description(chalk.cyan('Create mio starter'))
  .arguments('[directory]')
  .action(action)
  .parse(process.argv);
