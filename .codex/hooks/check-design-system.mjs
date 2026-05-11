import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const SOURCE_STYLE_EXTENSIONS = new Set(['.tsx', '.ts', '.css']);
const SOURCE_PREFIX = `src${path.sep}`;
const DESIGN_DOC_PREFIX = `${path.join('docs', 'design')}${path.sep}`;

const VIOLATION_PATTERNS = [
  {
    name: 'Tailwind arbitrary color',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to)-\[(?:#|rgb\(|rgba\(|hsl\(|hsla\()/g,
    message:
      'Use src/index.css theme tokens such as bg-card, text-foreground, or border-border instead of arbitrary colors.',
  },
  {
    name: 'Inline style color',
    pattern: /\b(?:color|background|backgroundColor|borderColor)\s*:/g,
    message: 'Avoid inline color styles; use design tokens and Tailwind classes instead.',
  },
  {
    name: 'Undocumented heavy decoration',
    pattern: /\b(?:blur-\w+|backdrop-blur(?:-\w+)?|from-\w+|via-\w+|to-\w+|rounded-full)\b/g,
    message:
      'This decoration pattern is not part of the current quiet notes UI. Document the new pattern or reuse existing radius/shadow/color rules.',
  },
];

function git(args, options = {}) {
  return execFileSync(
    'git',
    ['-c', `safe.directory=${process.cwd().replaceAll('\\', '/')}`, ...args],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    },
  );
}

function getRepoRoot() {
  try {
    return git(['rev-parse', '--show-toplevel']).trim();
  } catch {
    return process.cwd();
  }
}

function normalizeRelative(filePath, root) {
  return path.relative(root, path.resolve(root, filePath));
}

function parseChangedFilesFromGit(root) {
  const files = new Set();

  try {
    const diffOutput = git([
      'diff',
      '--name-only',
      '--diff-filter=ACMR',
      'HEAD',
      '--',
      'src',
      'docs/design',
    ]);
    for (const line of diffOutput.split(/\r?\n/)) {
      if (line.trim()) files.add(line.trim());
    }
  } catch {
    // Repositories without HEAD still fall back to status below.
  }

  try {
    const statusOutput = git(['status', '--short', '--', 'src', 'docs/design']);
    for (const line of statusOutput.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const rawPath = line.slice(3).trim();
      const cleanedPath = rawPath.includes(' -> ') ? rawPath.split(' -> ').pop() : rawPath;
      if (cleanedPath) files.add(cleanedPath.replaceAll('/', path.sep));
    }
  } catch {
    // If git status is unavailable, inspect no files rather than failing every Stop hook.
  }

  return [...files].map((file) => normalizeRelative(file, root));
}

function readFileIfExists(root, relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(path.resolve(root))) return '';
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return '';
  return fs.readFileSync(absolutePath, 'utf8');
}

function inspectContent(file, content) {
  const violations = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const rule of VIOLATION_PATTERNS) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        violations.push({
          file,
          line: index + 1,
          rule: rule.name,
          message: rule.message,
          snippet: line.trim().slice(0, 180),
        });
      }
    }
  });

  return violations;
}

function runSelfTest() {
  const fixture = [
    '<div className="bg-[#fff] rounded-full">',
    "const style = { color: 'red' };",
    '<div className="from-blue-500 to-purple-500" />',
  ].join('\n');
  const violations = inspectContent('src/__design_check_fixture__.tsx', fixture);

  if (violations.length < 3) {
    process.stderr.write(
      `Design check self-test failed: expected at least 3 violations, got ${violations.length}.\n`,
    );
    process.exit(1);
  }

  process.stdout.write('Design system check self-test passed.\n');
  process.exit(0);
}

function main() {
  if (process.argv.includes('--self-test')) {
    runSelfTest();
  }

  const root = getRepoRoot();
  process.chdir(root);

  const changedFiles = parseChangedFilesFromGit(root);
  const sourceFiles = changedFiles.filter((file) => {
    const normalized = file.replaceAll('/', path.sep);
    return (
      normalized.startsWith(SOURCE_PREFIX) && SOURCE_STYLE_EXTENSIONS.has(path.extname(normalized))
    );
  });
  const designDocFiles = changedFiles.filter((file) =>
    file.replaceAll('/', path.sep).startsWith(DESIGN_DOC_PREFIX),
  );

  const violations = sourceFiles.flatMap((file) =>
    inspectContent(file, readFileIfExists(root, file)),
  );
  const warnings = [];

  if (sourceFiles.length > 0 && designDocFiles.length === 0) {
    warnings.push(
      'Source style files changed without docs/design changes. Confirm whether design.md, tokens.md, components.md, interactions.md, or patterns.md needs an update.',
    );
  }

  if (violations.length === 0) {
    if (warnings.length > 0) {
      process.stdout.write(
        `Design system warnings:\n${warnings.map((warning) => `- ${warning}`).join('\n')}\n`,
      );
    } else {
      process.stdout.write('Design system check passed.\n');
    }
    process.exit(0);
  }

  const output = [
    'Design system violations found:',
    ...violations.map(
      (violation) =>
        `- ${violation.file}:${violation.line} [${violation.rule}] ${violation.message}\n  ${violation.snippet}`,
    ),
  ];

  if (warnings.length > 0) {
    output.push('Warnings:', ...warnings.map((warning) => `- ${warning}`));
  }

  process.stderr.write(`${output.join('\n')}\n`);
  process.exit(1);
}

main();
