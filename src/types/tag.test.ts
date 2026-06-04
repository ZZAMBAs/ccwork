import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('tag public type contract', () => {
  it('should expose the required tag detail and list callback props when the public tag type contract is used', () => {
    const tagSource = readFileSync(resolve(process.cwd(), 'src/types/tag.ts'), 'utf8');

    const detailPropsBody = tagSource.match(
      /export\s+interface\s+TagDetailViewProps\s*\{(?<body>[\s\S]*?)\n\}/,
    )?.groups?.body;
    const listPropsBody = tagSource.match(
      /export\s+interface\s+TagListViewProps\s*\{(?<body>[\s\S]*?)\n\}/,
    )?.groups?.body;

    expect(
      detailPropsBody,
      'TagDetailViewProps must be exported from src/types/tag.ts',
    ).toBeDefined();
    expect(detailPropsBody ?? '').toContain('tag: TagSummary;');
    expect(detailPropsBody ?? '').toContain('notes: TaggedNoteCard[];');
    expect(detailPropsBody ?? '').toContain('onBackToTagList: () => void;');
    expect(detailPropsBody ?? '').toContain('onBackToNotes: () => void;');
    expect(detailPropsBody ?? '').toContain('onSelectNote: (noteId: string) => void;');
    expect(listPropsBody ?? '').toMatch(/\bonSelectNote:\s*\(noteId:\s*string\)\s*=>\s*void;/);
    expect(listPropsBody ?? '').not.toMatch(/\bonSelectNote\?:/);
  });
});
