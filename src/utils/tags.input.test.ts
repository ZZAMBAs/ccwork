import { describe, expect, it } from 'vitest';

import {
  addTagsToList,
  getTagComparisonKey,
  getTagValidationError,
  normalizeTagName,
  parseTagInput,
  removeTagFromList,
} from './tags';

describe('normalizeTagName', () => {
  it('should trim outer whitespace and collapse inner whitespace when input contains repeated spaces', () => {
    expect(normalizeTagName('  React   Query  ')).toBe('React Query');
  });
});

describe('getTagComparisonKey', () => {
  it('should return the same comparison key when tag names differ only by case and repeated spaces', () => {
    expect(getTagComparisonKey('React Query')).toBe(getTagComparisonKey('react   query'));
  });
});

describe('getTagValidationError', () => {
  it('should return null when the normalized tag name is valid', () => {
    expect(getTagValidationError('React Query')).toBeNull();
  });

  it('should return too-short when normalized input is shorter than two characters', () => {
    expect(getTagValidationError('R')).toEqual(expect.objectContaining({ code: 'too-short' }));
  });

  it('should return too-long when normalized input is longer than twenty characters', () => {
    expect(getTagValidationError('a'.repeat(21))).toEqual(
      expect.objectContaining({ code: 'too-long' }),
    );
  });

  it('should return invalid-characters when input contains characters outside the allowed set', () => {
    expect(getTagValidationError('React!')).toEqual(
      expect.objectContaining({ code: 'invalid-characters' }),
    );
  });
});

describe('parseTagInput', () => {
  it('should return separate tags when comma-separated input contains multiple valid tag names', () => {
    expect(parseTagInput('React, TypeScript, Vite')).toEqual({
      tags: ['React', 'TypeScript', 'Vite'],
      errors: [],
    });
  });

  it('should ignore empty fragments when comma-separated input contains consecutive commas and blank fragments', () => {
    expect(parseTagInput('React,, ,TypeScript')).toEqual({
      tags: ['React', 'TypeScript'],
      errors: [],
    });
  });
});

describe('addTagsToList', () => {
  it('should add a normalized tag when the user submits a single valid tag', () => {
    expect(addTagsToList([], 'React')).toEqual({ tags: ['React'], errors: [] });
  });

  it('should add React Query when input is surrounded by spaces and repeated inner spaces', () => {
    expect(addTagsToList([], '  React   Query  ')).toEqual({
      tags: ['React Query'],
      errors: [],
    });
  });

  it('should keep #React and React as separate tags when both are added', () => {
    expect(addTagsToList(['#React'], 'React')).toEqual({
      tags: ['#React', 'React'],
      errors: [],
    });
  });

  it('should merge duplicates into one tag when a single input contains the same comparison key multiple times', () => {
    expect(addTagsToList([], 'React, react, React  ')).toEqual({
      tags: ['React'],
      errors: [],
    });
  });

  it('should keep the existing tag list unchanged when input matches an existing tag by comparison key', () => {
    expect(addTagsToList(['React Query'], 'react   query')).toEqual({
      tags: ['React Query'],
      errors: [],
    });
  });

  it('should reject the whole addition when adding multiple tags would exceed the max tag count', () => {
    expect(addTagsToList(['A1', 'A2', 'A3', 'A4'], 'A5, A6', 5)).toEqual({
      tags: ['A1', 'A2', 'A3', 'A4'],
      errors: [expect.objectContaining({ code: 'too-many' })],
    });
  });

  it('should return the first validation error and keep current tags unchanged when any submitted tag is invalid', () => {
    expect(addTagsToList(['React'], 'R, TypeScript')).toEqual({
      tags: ['React'],
      errors: [expect.objectContaining({ code: 'too-short' })],
    });
  });
});

describe('removeTagFromList', () => {
  it('should remove only the selected tag when a tag removal is requested', () => {
    expect(removeTagFromList(['React', 'TypeScript'], 'React')).toEqual(['TypeScript']);
  });
});
