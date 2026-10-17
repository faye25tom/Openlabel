import { spawnSync } from 'node:child_process';
import { copyFile, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stage = path.join(root, '.desktop-build');
const sourcePackage = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const electronPackage = JSON.parse(
  await readFile(path.join(root, 'node_modules', 'electron', 'package.json'), 'utf8'),
);

await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
await cp(path.join(root, 'dist'), path.join(stage, 'dist'), { recursive: true });
await cp(path.join(root, 'electron'), path.join(stage, 'electron'), { recursive: true });
await cp(path.join(root, 'assets'), path.join(stage, 'assets'), { recursive: true });

const desktopPackage = {
  name: sourcePackage.name,
  version: sourcePackage.version,
  description: sourcePackage.description,
  author: sourcePackage.author,
  main: 'electron/main.cjs',
  private: true,
  build: {
    ...sourcePackage.build,
    electronVersion: electronPackage.version,
    directories: {
      ...sourcePackage.build.directories,
      output: 'release',
    },
  },
};

await writeFile(
  path.join(stage, 'package.json'),
  `${JSON.stringify(desktopPackage, null, 2)}\n`,
  'utf8',
);

const builderCli = path.join(root, 'node_modules', 'electron-builder', 'out', 'cli', 'cli.js');
const result = spawnSync(
  process.execPath,
  [builderCli, '--projectDir', stage, '--win', 'nsis', '--x64'],
  { cwd: root, env: process.env, stdio: 'inherit' },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const targetRelease = path.join(root, 'release');
await mkdir(targetRelease, { recursive: true });
const builtFiles = await readdir(path.join(stage, 'release'));
for (const fileName of builtFiles) {
  if (/^OpenLabel-Studio-.*\.(exe|blockmap)$/.test(fileName) || fileName === 'latest.yml') {
    await copyFile(path.join(stage, 'release', fileName), path.join(targetRelease, fileName));
  }
}

console.log(`Windows installer copied to ${targetRelease}`);
