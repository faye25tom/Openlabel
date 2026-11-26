import { spawnSync } from 'node:child_process';
import { copyFile, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const options = {
    platform: null,
    version: null,
    stageOnly: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--platform' && argv[i + 1]) {
      options.platform = argv[++i].toLowerCase();
    } else if (arg === '--version' && argv[i + 1]) {
      options.version = argv[++i];
    } else if (arg === '--stage-only') {
      options.stageOnly = true;
    }
  }

  return options;
}

function defaultPlatform() {
  if (process.platform === 'win32') return 'win';
  if (process.platform === 'darwin') return 'mac';
  return 'linux';
}

function normalizeVersion(rawVersion) {
  return String(rawVersion || '').trim().replace(/^v/i, '');
}

const args = parseArgs(process.argv.slice(2));
const platform = args.platform || defaultPlatform();
if (!['win', 'mac', 'linux'].includes(platform)) {
  console.error(`Unsupported --platform "${platform}". Expected win, mac, or linux.`);
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stage = path.join(root, '.desktop-build');
const sourcePackage = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const electronPackage = JSON.parse(
  await readFile(path.join(root, 'node_modules', 'electron', 'package.json'), 'utf8'),
);

const version = normalizeVersion(
  args.version || process.env.RELEASE_VERSION || sourcePackage.version,
);
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Invalid release version "${version}". Expected semver (e.g. 1.0.3 or 1.0.3-rc.1).`);
  process.exit(1);
}

await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
await cp(path.join(root, 'dist'), path.join(stage, 'dist'), { recursive: true });
await cp(path.join(root, 'electron'), path.join(stage, 'electron'), { recursive: true });
await cp(path.join(root, 'assets'), path.join(stage, 'assets'), { recursive: true });

const desktopPackage = {
  name: sourcePackage.name,
  version,
  description: sourcePackage.description,
  author: sourcePackage.author,
  homepage: sourcePackage.homepage,
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

if (args.stageOnly) {
  console.log(`Staged ${platform} desktop build v${version} at ${stage}`);
  process.exit(0);
}

const builderCli = path.join(root, 'node_modules', 'electron-builder', 'out', 'cli', 'cli.js');
const builderArgs = ['--projectDir', stage, '--publish', 'never'];

if (platform === 'win') {
  builderArgs.push('--win', 'nsis', 'portable', '--x64');
} else if (platform === 'mac') {
  builderArgs.push('--mac', 'dmg', 'zip', '--arm64', '--x64');
} else {
  builderArgs.push('--linux', 'AppImage', 'deb', '--x64');
}

const result = spawnSync(process.execPath, [builderCli, ...builderArgs], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const targetRelease = path.join(root, 'release');
await rm(targetRelease, { recursive: true, force: true });
await mkdir(targetRelease, { recursive: true });
const builtFiles = await readdir(path.join(stage, 'release'));
const artifactPattern =
  /^(OpenLabel-Studio-.*\.(exe|blockmap|dmg|zip|AppImage|deb)|latest.*\.yml)$/i;

const copiedFiles = [];
for (const fileName of builtFiles) {
  if (artifactPattern.test(fileName)) {
    await copyFile(path.join(stage, 'release', fileName), path.join(targetRelease, fileName));
    copiedFiles.push(fileName);
  }
}

if (copiedFiles.length === 0) {
  console.error(`No matching installer artifacts were found in ${path.join(stage, 'release')}.`);
  process.exit(1);
}

console.log(`Built ${platform} installer artifacts (${copiedFiles.length}): ${copiedFiles.join(', ')}`);
