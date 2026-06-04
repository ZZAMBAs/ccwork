import { describe, expect, it } from 'vitest';

import {
  collectTagSummaries,
  searchTagSummaries,
  sortTagSummariesForList,
  sortTagSummariesForSearch,
} from './tags';
import * as tagUtils from './tags';

import type { Note } from '../types/note';
import type { TagSummary } from '../types/tag';

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

function summary(overrides: Partial<TagSummary> = {}): TagSummary {
  return {
    comparisonKey: 'react',
    tagName: 'React',
    noteCount: 1,
    latestUpdatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('collectTagSummaries', () => {
  it('should aggregate valid saved tags with note count and latest updated date when notes contain tags', () => {
    expect(
      collectTagSummaries([
        note({ id: '1', tags: ['React'], updatedAt: '2026-01-01T00:00:00.000Z' }),
        note({ id: '2', tags: ['react'], updatedAt: '2026-01-03T00:00:00.000Z' }),
      ]),
    ).toEqual([
      expect.objectContaining({
        comparisonKey: 'react',
        tagName: 'react',
        noteCount: 2,
        latestUpdatedAt: '2026-01-03T00:00:00.000Z',
      }),
    ]);
  });

  it('should count duplicate comparison keys once when the same note contains duplicate persisted tags', () => {
    expect(collectTagSummaries([note({ tags: ['React', 'react'] })])).toEqual([
      expect.objectContaining({
        comparisonKey: 'react',
        noteCount: 1,
      }),
    ]);
  });

  it('should exclude invalid persisted tags when notes contain invalid tag values', () => {
    expect(collectTagSummaries([note({ tags: ['R', 'React'] })])).toEqual([
      expect.objectContaining({ comparisonKey: 'react' }),
    ]);
  });

  it('should choose the most frequently used display name when comparison keys share multiple notations', () => {
    expect(
      collectTagSummaries([
        note({ id: '1', tags: ['React'], updatedAt: '2026-01-01T00:00:00.000Z' }),
        note({ id: '2', tags: ['react'], updatedAt: '2026-01-02T00:00:00.000Z' }),
        note({ id: '3', tags: ['React'], updatedAt: '2026-01-03T00:00:00.000Z' }),
      ]),
    ).toEqual([expect.objectContaining({ tagName: 'React' })]);
  });

  it('should choose the most recently used display name when notation usage counts are tied', () => {
    expect(
      collectTagSummaries([
        note({ id: '1', tags: ['React'], updatedAt: '2026-01-01T00:00:00.000Z' }),
        note({ id: '2', tags: ['react'], updatedAt: '2026-01-02T00:00:00.000Z' }),
      ]),
    ).toEqual([expect.objectContaining({ tagName: 'react' })]);
  });
});

describe('sortTagSummariesForList', () => {
  it('should order tag cards by latest updated date when query is empty', () => {
    expect(
      sortTagSummariesForList([
        summary({
          comparisonKey: 'react',
          tagName: 'React',
          latestUpdatedAt: '2026-01-01T00:00:00.000Z',
        }),
        summary({
          comparisonKey: 'vite',
          tagName: 'Vite',
          latestUpdatedAt: '2026-01-03T00:00:00.000Z',
        }),
      ]).map((tag) => tag.tagName),
    ).toEqual(['Vite', 'React']);
  });
});

describe('searchTagSummaries', () => {
  it('should return prefix matches without case sensitivity when a user types a query', () => {
    expect(
      searchTagSummaries(
        [
          summary({ comparisonKey: 'react', tagName: 'React' }),
          summary({ comparisonKey: 'vite', tagName: 'Vite' }),
        ],
        're',
      ),
    ).toEqual([expect.objectContaining({ tagName: 'React' })]);
  });
});

describe('sortTagSummariesForSearch', () => {
  it('should order searched tag cards by shorter matched name, latest updated date, and display name when multiple tags match', () => {
    expect(
      sortTagSummariesForSearch(
        [
          summary({
            comparisonKey: 'reason',
            tagName: 'Reason',
            latestUpdatedAt: '2026-01-04T00:00:00.000Z',
          }),
          summary({
            comparisonKey: 'react',
            tagName: 'React',
            latestUpdatedAt: '2026-01-01T00:00:00.000Z',
          }),
          summary({
            comparisonKey: 'redux',
            tagName: 'Redux',
            latestUpdatedAt: '2026-01-03T00:00:00.000Z',
          }),
          summary({
            comparisonKey: 'remix',
            tagName: 'Remix',
            latestUpdatedAt: '2026-01-03T00:00:00.000Z',
          }),
        ],
        're',
      ).map((tag) => tag.tagName),
    ).toEqual(['Redux', 'Remix', 'React', 'Reason']);
  });
});

describe('getNotesByTag', () => {
  it('should return only notes with the selected tag sorted by latest updatedAt and mapped with fallback title, optional content preview, updated date, and all tag chips when matching notes exist', () => {
    const getNotesByTag = (
      tagUtils as {
        getNotesByTag?: (notes: Note[], comparisonKey: string) => unknown;
      }
    ).getNotesByTag;

    expect(
      getNotesByTag?.(
        [
          note({
            id: 'older',
            title: '',
            content: '   ',
            tags: ['React', 'Testing'],
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
          note({
            id: 'newer',
            title: 'Latest React',
            content: '  Preview body  ',
            tags: ['react', 'Vite'],
            updatedAt: '2026-01-03T00:00:00.000Z',
          }),
          note({
            id: 'other',
            title: 'Vite only',
            content: 'No match',
            tags: ['Vite'],
            updatedAt: '2026-01-04T00:00:00.000Z',
          }),
        ],
        'react',
      ),
    ).toEqual([
      {
        id: 'newer',
        title: 'Latest React',
        contentPreview: 'Preview body',
        tags: ['react', 'Vite'],
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
      {
        id: 'older',
        title: '(제목 없음)',
        contentPreview: '',
        tags: ['React', 'Testing'],
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });
});
