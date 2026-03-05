#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const {execSync} = require('child_process');

async function main() {
  if (!process.stdin.isTTY) {
    console.error('当前终端不是交互式 TTY，无法运行 init。请在真实终端里执行：npm run init');
    process.exitCode = 1;
    return;
  }

  // 动态导入 inquirer（ESM 兼容）
  const inquirerModule = await import('inquirer');
  const inquirer = inquirerModule.default || inquirerModule;

  const root = path.join(__dirname, '..');

  function fileExists(filePath) {
    try {
      fs.accessSync(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  function copyFile(src, dest, {overwrite}) {
    if (!fileExists(src)) {
      console.warn(`跳过：未找到 ${src}`);
      return {copied: false, reason: 'src-missing'};
    }

    if (fileExists(dest) && !overwrite) {
      console.log(`跳过：已存在 ${dest}`);
      return {copied: false, reason: 'dest-exists'};
    }

    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.copyFileSync(src, dest);
    console.log(`已复制: ${src} -> ${dest}`);
    return {copied: true};
  }

  function run(command, {cwd}) {
    execSync(command, {cwd, stdio: 'inherit'});
  }

  function readJson(jsonPath) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }

  function writeJson(jsonPath, json) {
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n');
  }

  function normalizeScope(input) {
    const scope = (input || '').trim();
    if (!scope) return '';
    return scope.startsWith('@') ? scope : `@${scope}`;
  }

  function scopedName(scope, name) {
    return scope ? `${scope}/${name}` : name;
  }

  const pkgPaths = {
    root: path.join(root, 'package.json'),
    backend: path.join(root, 'apps', 'nestjs-backend', 'package.json'),
    frontend: path.join(root, 'apps', 'vite-frontend', 'package.json'),
    db: path.join(root, 'packages', 'db', 'package.json'),
    shared: path.join(root, 'packages', 'shared', 'package.json'),
  };

  const currentRootPkg = readJson(pkgPaths.root);

  // 2. 交互获取 scope/包名，以及是否初始化 git
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'repoName',
      message: '请输入根 package.json 的 name（如 my-monorepo）:',
      default: currentRootPkg.name || 'my-monorepo',
      validate: (input) => !!input.trim() || '包名不能为空',
    },
    {
      type: 'input',
      name: 'scope',
      message: '请输入 npm scope（如 @myorg，可留空）:',
      default: '',
    },
    {
      type: 'confirm',
      name: 'initGit',
      message: '是否初始化新的 Git 仓库？',
      default: false,
    },
    {
      type: 'confirm',
      name: 'resetGit',
      message: '检测到 .git，是否删除并重新初始化？',
      default: true,
      when: (a) => a.initGit && fs.existsSync(path.join(root, '.git')),
    },
  ]);

  const repoName = answers.repoName.trim();
  const scope = normalizeScope(answers.scope);
  const initGit = !!answers.initGit;
  const resetGit = !!answers.resetGit;

  const targetNames = {
    root: repoName,
    backend: scopedName(scope, 'nestjs-backend'),
    frontend: scopedName(scope, 'vite-frontend'),
    db: scopedName(scope, 'db'),
    shared: scopedName(scope, 'shared'),
  };

  const pkgs = {
    root: readJson(pkgPaths.root),
    backend: readJson(pkgPaths.backend),
    frontend: readJson(pkgPaths.frontend),
    db: readJson(pkgPaths.db),
    shared: readJson(pkgPaths.shared),
  };

  const renameMap = new Map();
  for (const key of Object.keys(pkgs)) {
    const oldName = pkgs[key].name;
    const newName = targetNames[key];
    if (oldName && newName && oldName !== newName) {
      renameMap.set(oldName, newName);
    }
  }

  const suffixRenameMap = new Map([
    ['nestjs-backend', targetNames.backend],
    ['vite-frontend', targetNames.frontend],
    ['db', targetNames.db],
    ['shared', targetNames.shared],
  ]);

  function rewriteDeps(obj) {
    if (!obj) return obj;
    const next = {};
    for (const [depName, depVersion] of Object.entries(obj)) {
      let mapped = renameMap.get(depName) || depName;

      // 兼容模板里常见的旧 scope（例如 @xxx/db、@xxx/shared 等）
      if (mapped.startsWith('@')) {
        const match = mapped.match(/^@[^/]+\/([^/]+)$/);
        if (match) {
          const suffix = match[1];
          const renamed = suffixRenameMap.get(suffix);
          if (renamed) mapped = renamed;
        }
      }

      next[mapped] = depVersion;
    }
    return next;
  }

  // 写入新的 name，并重写内部依赖名
  for (const key of Object.keys(pkgs)) {
    const pkg = pkgs[key];
    pkg.name = targetNames[key];
    pkg.dependencies = rewriteDeps(pkg.dependencies);
    pkg.devDependencies = rewriteDeps(pkg.devDependencies);
    pkg.peerDependencies = rewriteDeps(pkg.peerDependencies);
    pkg.optionalDependencies = rewriteDeps(pkg.optionalDependencies);
  }

  writeJson(pkgPaths.root, pkgs.root);
  console.log(`已修改: ${pkgPaths.root}`);
  writeJson(pkgPaths.backend, pkgs.backend);
  console.log(`已修改: ${pkgPaths.backend}`);
  writeJson(pkgPaths.frontend, pkgs.frontend);
  console.log(`已修改: ${pkgPaths.frontend}`);
  writeJson(pkgPaths.db, pkgs.db);
  console.log(`已修改: ${pkgPaths.db}`);
  writeJson(pkgPaths.shared, pkgs.shared);
  console.log(`已修改: ${pkgPaths.shared}`);
  console.log('workspace 的 package.json 已更新（不会再扫描 node_modules）。');

  const pairs = [
    {
      src: path.join(root, '.env.example'),
      dest: path.join(root, '.env'),
    },
    {
      src: path.join(root, 'apps', 'vite-frontend', '.env.example'),
      dest: path.join(root, 'apps', 'vite-frontend', '.env'),
    },
    {
      src: path.join(root, 'apps', 'nestjs-backend', '.env.example'),
      dest: path.join(root, 'apps', 'nestjs-backend', '.env'),
    },
  ];

  for (const {src, dest} of pairs) {
    copyFile(src, dest, {overwrite: false});
  }

  try {
    console.log('开始构建 packages/db ...');
    run('npm run build -w packages/db', {cwd: root});
    console.log('开始构建 packages/shared ...');
    run('npm run build -w packages/shared', {cwd: root});
    console.log('构建完成。');
  } catch (err) {
    console.error('构建失败：', err.message);
    process.exitCode = 1;
    return;
  }

  if (initGit) {
    try {
      if (resetGit) {
        fs.rmSync(path.join(root, '.git'), {recursive: true, force: true});
      }
      run('git init', {cwd: root});
      console.log('已初始化新的 Git 仓库。');
    } catch (err) {
      console.error('初始化 Git 仓库失败：', err.message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
