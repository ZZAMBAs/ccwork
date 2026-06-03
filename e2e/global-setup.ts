import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const fixturePath = path.join(__dirname, 'fixtures', 'tag-db.json');
const tmpDir = path.join(__dirname, '.tmp');
const tmpDbPath = path.join(tmpDir, 'db.json');
const pidPath = path.join(tmpDir, 'server-pids.json');

function resetDb() {
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.copyFileSync(fixturePath, tmpDbPath);
}

function startNodeScript(scriptPath: string, args: string[]) {
  const child = spawn(process.execPath, [scriptPath, ...args], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  return child.pid;
}

async function waitForUrl(url: string) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

export default async function globalSetup() {
  resetDb();

  const jsonServerBin = path.join(root, 'node_modules', 'json-server', 'lib', 'bin.js');
  const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const pids = [
    startNodeScript(jsonServerBin, ['--watch', tmpDbPath, '--port', '3001']),
    startNodeScript(viteBin, ['--host', '127.0.0.1', '--port', '5173']),
  ];

  fs.writeFileSync(pidPath, JSON.stringify(pids));

  await waitForUrl('http://localhost:3001/notes');
  await waitForUrl('http://localhost:5173');
}
