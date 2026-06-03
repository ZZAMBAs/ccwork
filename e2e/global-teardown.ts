import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const pidPath = path.join(__dirname, '.tmp', 'server-pids.json');

export default async function globalTeardown() {
  if (!fs.existsSync(pidPath)) return;

  const pids = JSON.parse(fs.readFileSync(pidPath, 'utf8')) as number[];
  for (const pid of pids) {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      try {
        process.kill(-pid, 'SIGTERM');
      } catch {
        // Process already exited.
      }
    }
  }

  fs.rmSync(pidPath, { force: true });
}
