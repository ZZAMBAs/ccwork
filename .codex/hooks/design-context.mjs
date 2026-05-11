import process from 'node:process';

const DESIGN_KEYWORDS = [
  'design',
  'style',
  'ui',
  'tailwind',
  'component',
  'layout',
  'css',
  'screen',
  'view',
  'frontend',
  '디자인',
  '스타일',
  '화면',
  '컴포넌트',
  '레이아웃',
  '프론트',
];

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

const rawInput = await readStdin();
const input = rawInput.trim() ? JSON.parse(rawInput) : {};
const prompt = String(input.prompt ?? '').toLowerCase();
const shouldInjectContext = DESIGN_KEYWORDS.some((keyword) => prompt.includes(keyword));

if (!shouldInjectContext) {
  writeJson({});
  process.exit(0);
}

writeJson({
  hookSpecificOutput: {
    hookEventName: 'UserPromptSubmit',
    additionalContext:
      "This request appears to involve UI, styling, layout, or frontend design. Before making style changes, read docs/design/design.md first, then read only the relevant linked detail docs. Use src/index.css theme tokens and existing Tailwind patterns before adding new values. After editing, check docs/design/patterns.md Do/Don't rules and docs/design/interactions.md for state/interaction consistency. If a new token, visual pattern, or interaction is introduced, update the relevant docs/design document in the same turn.",
  },
});
