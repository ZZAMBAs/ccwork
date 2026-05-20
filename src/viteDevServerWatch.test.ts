import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('vite dev server watch', () => {
  it('should ignore db.json changes so saving an existing note does not reload the app', () => {
    const viteConfigSource = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');

    expect(viteConfigSource).toContain('ignored');
    expect(viteConfigSource).toContain('**/db.json');
  });
});
