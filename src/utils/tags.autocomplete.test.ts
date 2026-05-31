import { describe, expect, it } from 'vitest';

import { collectTagAutocompleteCandidates, getTagAutocompleteSuggestions } from './tags';
import type { Note } from '../types/note';
import type { TagAutocompleteCandidate } from '../types/tag';

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: '1',
    title: 'Tagged note',
    content: 'Body',
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function candidate(overrides: Partial<TagAutocompleteCandidate> = {}): TagAutocompleteCandidate {
  return {
    comparisonKey: 'react',
    tagName: 'React',
    usageCount: 1,
    latestUpdatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('collectTagAutocompleteCandidates', () => {
  it('should aggregate saved valid tags by comparison key when notes contain reusable tags', () => {
    expect(
      collectTagAutocompleteCandidates([
        note({ id: '1', tags: ['React'] }),
        note({ id: '2', tags: ['react'] }),
      ]),
    ).toEqual([
      expect.objectContaining({
        comparisonKey: 'react',
        usageCount: 2,
      }),
    ]);
  });

  it('should exclude invalid persisted tags when notes contain invalid tag values', () => {
    expect(collectTagAutocompleteCandidates([note({ tags: ['R', 'React'] })])).toEqual([
      expect.objectContaining({ comparisonKey: 'react' }),
    ]);
  });

  it('should choose the most frequently used notation and then the most recently used notation when the same comparison key has multiple notations', () => {
    expect(
      collectTagAutocompleteCandidates([
        note({ id: '1', tags: ['React'], updatedAt: '2026-01-01T00:00:00.000Z' }),
        note({ id: '2', tags: ['react'], updatedAt: '2026-01-02T00:00:00.000Z' }),
        note({ id: '3', tags: ['React'], updatedAt: '2026-01-03T00:00:00.000Z' }),
      ]),
    ).toEqual([expect.objectContaining({ tagName: 'React' })]);

    expect(
      collectTagAutocompleteCandidates([
        note({ id: '1', tags: ['React'], updatedAt: '2026-01-01T00:00:00.000Z' }),
        note({ id: '2', tags: ['react'], updatedAt: '2026-01-02T00:00:00.000Z' }),
      ]),
    ).toEqual([expect.objectContaining({ tagName: 'react' })]);
  });
});

describe('getTagAutocompleteSuggestions', () => {
  it('should return prefix-matching suggestions without case sensitivity when input is `re`', () => {
    expect(
      getTagAutocompleteSuggestions(
        [
          candidate({ comparisonKey: 'react', tagName: 'React' }),
          candidate({ comparisonKey: 'vite', tagName: 'Vite' }),
        ],
        're',
        [],
      ),
    ).toEqual([expect.objectContaining({ tagName: 'React' })]);
  });

  it('should exclude suggestions already attached to the current note when comparison keys match', () => {
    expect(getTagAutocompleteSuggestions([candidate()], 're', ['react'])).toEqual([]);
  });

  it('should return at most three suggestions when more than three candidates match', () => {
    expect(
      getTagAutocompleteSuggestions(
        [
          candidate({ comparisonKey: 'react', tagName: 'React' }),
          candidate({ comparisonKey: 'reason', tagName: 'Reason' }),
          candidate({ comparisonKey: 'redux', tagName: 'Redux' }),
          candidate({ comparisonKey: 'remix', tagName: 'Remix' }),
        ],
        're',
        [],
      ),
    ).toHaveLength(3);
  });

  it('should order suggestions by shorter tag name, higher usage count, and more recent usage when multiple candidates match', () => {
    expect(
      getTagAutocompleteSuggestions(
        [
          candidate({ comparisonKey: 'reason', tagName: 'Reason', usageCount: 10 }),
          candidate({ comparisonKey: 'react', tagName: 'React', usageCount: 1 }),
          candidate({ comparisonKey: 'redux', tagName: 'Redux', usageCount: 3 }),
          candidate({
            comparisonKey: 'remix',
            tagName: 'Remix',
            usageCount: 3,
            latestUpdatedAt: '2026-01-02T00:00:00.000Z',
          }),
        ],
        're',
        [],
        4,
      ).map((suggestion) => suggestion.tagName),
    ).toEqual(['Remix', 'Redux', 'React', 'Reason']);
  });

  it('should return an empty list when normalized input is empty', () => {
    expect(getTagAutocompleteSuggestions([candidate()], '   ', [])).toEqual([]);
  });
});
