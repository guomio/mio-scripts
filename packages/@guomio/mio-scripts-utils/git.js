const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;

function getExecOptions(cwd) {
  if (cwd) {
    return { stdio: 'ignore', cwd: cwd };
  }
  return { stdio: 'ignore' };
}

function isInGitRepository(cwd) {
  const options = getExecOptions(cwd);
  try {
    execSync('git rev-parse --is-inside-work-tree', options);
    return true;
  } catch (e) {
    return false;
  }
}

function isInMercurialRepository(cwd) {
  const options = getExecOptions(cwd);
  try {
    execSync('hg --cwd . root', options);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 判断工作路径是否干净
 * @param {string} cwd 工作路径
 */
function isCleanGitRepository(cwd) {
  const res = execSync('git status -s', { stdio: 'pipe', cwd });
  return res.toString() === '';
}

/**
 * 打 tag
 * @param {string} cwd 工作路径
 * @param {string} name tag名称
 * @param {string} message 备注
 */
function tag(cwd, name, message) {
  const options = getExecOptions(cwd);
  try {
    execSync(`git tag ${name} -a -m '${message}'`, options);
    execSync(`git push origin ${name}`, options);
    return false;
  } catch (err) {
    return err;
  }
}

/**
 * 获取项目git位置
 * @param {sting} cwd 项目路径
 * @returns {string}
 */
function getPrefixPath(cwd) {
  try {
    out = execSync('git rev-parse --show-prefix', { cwd });
    return out.toString().trim();
  } catch (err) {
    console.log(err);
    return '';
  }
}

/**
 * 获取git远程origin
 * @param {sting} cwd 项目路径
 */
function getRemoteOrigin(cwd) {
  try {
    out = execSync('git remote -v', { cwd });
    return out
      .toString()
      .replace(/^.*\t/gm, '')
      .replace(/\(.*\)/g, '')
      .replace(/git@/g, 'https://')
      .replace(/\b:\b/, '/')
      .split('\n')[0]
      .trim();
  } catch (err) {
    console.log(err);
  }
}

/**
 * 获取commitid
 * @param {string} cwd 项目路径
 */
function getCommitID(cwd) {
  try {
    out = execSync('git rev-parse HEAD', { cwd });
    return out.toString().trim();
  } catch (err) {
    console.log(err);
  }
}

/**
 * 添加文件至git
 * @param {string} cwd
 * @param {string} path
 */
function add(cwd, path) {
  path = path || '.';
  try {
    out = execSync('git add ' + path, { cwd });
    return out.toString().trim();
  } catch (err) {
    console.log(err);
  }
}

/**
 * commit
 * @param {string} cwd
 * @param {string} message
 */
function commit(cwd, message) {
  try {
    out = execSync(`git commit -m '${message}'`, { cwd });
    return out.toString().trim();
  } catch (err) {
    console.log(err);
  }
}

/**
 * 推送
 * @param {string} cwd
 */
function push(cwd) {
  try {
    execSync('git push', { cwd, stdio: 'ignore' });
  } catch (err) {
    console.log(err);
  }
}

/**
 * 拉取
 * @param {string} cwd
 */
function pull(cwd) {
  try {
    execSync('git pull', { cwd, stdio: 'ignore' });
  } catch (err) {
    console.log(err);
  }
}

exports.isCleanGitRepository = isCleanGitRepository;
exports.getExecOptions = getExecOptions;
exports.isInGitRepository = isInGitRepository;
exports.tag = tag;
exports.getPrefixPath = getPrefixPath;
exports.getRemoteOrigin = getRemoteOrigin;
exports.getCommitID = getCommitID;
exports.add = add;
exports.commit = commit;
exports.push = push;
exports.pull = pull;

exports.init = function tryGitInit(cwd) {
  let didInit = false;
  const options = getExecOptions(cwd);
  try {
    execSync('git --version', options);
    if (isInGitRepository(cwd) || isInMercurialRepository(cwd)) {
      return false;
    }

    execSync('git init', options);
    didInit = true;

    execSync('git add -A', options);
    execSync('git commit -m "Initial commit from mio-cli"', options);
    return true;
  } catch (e) {
    if (didInit) {
      // If we successfully initialized but couldn't commit,
      // maybe the commit author config is not set.
      // In the future, we might supply our own committer
      // like Ember CLI does, but for now, let's just
      // remove the Git files to avoid a half-done state.
      try {
        // unlinkSync() doesn't work on directories.
        fs.removeSync(path.join(cwd, '.git'));
      } catch (removeErr) {
        // Ignore.
      }
    }
    return false;
  }
};
