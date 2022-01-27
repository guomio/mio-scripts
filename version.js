const globby = require('globby');
const inquirer = require('inquirer');
const fs = require('fs');
const semver = require('semver');
const spawn = require('cross-spawn');
const execSync = require('child_process').execSync;

const Packages = globby.sync('./packages/@guomio/*/package.json');
const TestPakcages = globby.sync('./packages/@test/*/package.json');

/**
 * 比较本地版本和远程版本，选择版本较高的
 * @param {string} name
 * @param {string} version
 * @returns {string}
 */
function raceVersion(name, version) {
  const npmSpawn = spawn.sync('npm', [
    '--registry',
    'https://registry.npmjs.org/',
    'view',
    name,
    'version',
  ]);
  if (npmSpawn.signal) {
    return version;
  }
  const v = npmSpawn.stdout.toString().trim() || '0.0.0';
  return semver.compare(v, version) > 0 ? v : version;
}

/**
 * 生成新版本
 * @param {string} name
 * @param {string} version
 */
async function genSemver(name, version) {
  const nextPatch = semver.inc(version, 'patch');
  const nextBeta = semver.inc(version, 'prerelease', 'beta');
  const nextMinor = semver.inc(version, 'minor');
  const nextMajor = semver.inc(version, 'major');

  const resp = await inquirer.prompt(
    [
      {
        type: 'list',
        name: 'action',
        message: 'What do you want to publish? ' + `${name}@${version}`,
        choices: [
          { name: `Skip  version ${version}`, value: version },
          { name: `Patch version ${nextPatch}`, value: nextPatch },
          { name: `Beta  version ${nextBeta}`, value: nextBeta },
          { name: `Minor version ${nextMinor}`, value: nextMinor },
          { name: `Major version ${nextMajor}`, value: nextMajor },
        ],
      },
    ],
    { onCancel: () => process.exit(0) },
  );
  return resp.action;
}

/**
 * 重写其他依赖此包的项目依赖
 * @param {string} name
 * @param {string} version
 * @param {string[]} pkgpaths
 */
function rewriteDependencies(name, version, pkgpaths) {
  pkgpaths.forEach((pkgpath) => {
    const pkg = require(pkgpath);
    if (pkg.name === name) {
      return;
    }
    if (pkg.dependencies && pkg.dependencies[name] && pkg.dependencies[name] !== version) {
      pkg.dependencies[name] = version;
      fs.writeFileSync(pkgpath, JSON.stringify(pkg, undefined, 2), { encoding: 'utf-8' });
    }
    if (pkg.devDependencies && pkg.devDependencies[name] && pkg.devDependencies[name] !== version) {
      pkg.devDependencies[name] = version;
      fs.writeFileSync(pkgpath, JSON.stringify(pkg, undefined, 2), { encoding: 'utf-8' });
    }
    if (
      pkg.peerDependencies &&
      pkg.peerDependencies[name] &&
      pkg.peerDependencies[name] !== version
    ) {
      pkg.peerDependencies[name] = version;
      fs.writeFileSync(pkgpath, JSON.stringify(pkg, undefined, 2), { encoding: 'utf-8' });
    }
  });
}

/**
 * 推送 git
 * @param {{name:string;version:string;}[]} pkgs
 */
function gitSync(pkgs) {
  const cwd = process.cwd();
  execSync('git add .', { cwd });
  execSync(`git commit -m 'release'`, { cwd });
  execSync('git push', { cwd, stdio: 'ignore' });
  pkgs.forEach((pkg) => {
    execSync(`git tag ${pkg.name}@${pkg.version} -a -m '${pkg.name}@${pkg.version}'`, { cwd });
    execSync(`git push origin ${pkg.name}@${pkg.version}`, { cwd, stdio: 'ignore' });
  });
}

(async function run() {
  const pkgs = [];
  for (let i = 0; i < Packages.length; i++) {
    const pkgpath = Packages[i];
    const pkg = require(pkgpath);
    const version = await genSemver(pkg.name, raceVersion(pkg.name, pkg.version));
    if (!version || pkg.version === version) {
      continue;
    }
    pkg.version = version;
    fs.writeFileSync(pkgpath, JSON.stringify(pkg, undefined, 2), { encoding: 'utf-8' });
    pkgs.push({ name: pkg.name, version });
    rewriteDependencies(pkg.name, version, [...Packages, ...TestPakcages]);
  }
  if (pkgs.length) {
    try {
      gitSync(pkgs);
    } catch (err) {}
  }
})();
