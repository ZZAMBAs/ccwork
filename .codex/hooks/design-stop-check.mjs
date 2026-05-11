import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
  });
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function runGit(args) {
  return execFileSync(
    'git',
    ['-c', `safe.directory=${process.cwd().replaceAll('\\', '/')}`, ...args],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
}

function getRepoRoot() {
  try {
    return runGit(['rev-parse', '--show-toplevel']).trim();
  } catch {
    return process.cwd();
  }
}

const rawInput = await readStdin();
const input = rawInput.trim() ? JSON.parse(rawInput) : {};

if (input.stop_hook_active === true) {
  writeJson({});
  process.exit(0);
}

const root = getRepoRoot();

try {
  execFileSync('node', [path.join(root, '.codex', 'hooks', 'check-design-system.mjs')], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  writeJson({});
} catch (error) {
  const stderr = error.stderr?.toString().trim();
  const stdout = error.stdout?.toString().trim();
  const details = stderr || stdout || 'Design system check failed without details.';

  writeJson({
    decision: 'block',
    reason: `Design system validation failed.\n\n${details}\n\nRead docs/design/design.md and docs/design/patterns.md, fix the violations using existing theme tokens and documented patterns, then rerun node .codex/hooks/check-design-system.mjs.`,
  });
}
