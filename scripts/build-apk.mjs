import { spawnSync, execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const workspace = mkdtempSync(join(tmpdir(), 'watchever-apk-'));
const output = resolve(root, 'dist/Watchever.apk');

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Budowanie zakończone kodem ${result.status}.`);
}

try {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const name of files) {
    if (!existsSync(join(root, name))) continue;
    const destination = join(workspace, name);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(root, name), destination);
  }
  if (existsSync(join(root, '.env.local'))) copyFileSync(join(root, '.env.local'), join(workspace, '.env.local'));
  else if (!process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN) throw new Error('Ustaw token TMDB w .env.local.');
  symlinkSync(join(root, 'node_modules'), join(workspace, 'node_modules'), 'dir');
  run(process.execPath, [join(root, 'node_modules/expo/bin/cli'), 'prebuild', '--platform', 'android', '--no-install'], workspace);
  run(join(workspace, 'android/gradlew'), [':app:assembleRelease', '--console=plain'], join(workspace, 'android'));
  mkdirSync(dirname(output), { recursive: true });
  copyFileSync(join(workspace, 'android/app/build/outputs/apk/release/app-release.apk'), output);
  console.log(`APK: ${output}`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
