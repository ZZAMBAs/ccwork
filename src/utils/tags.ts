import type { Note } from '../types/note';
import type { TagAutocompleteCandidate, TagParseResult, TagValidationError } from '../types/tag';

const DEFAULT_MAX_TAGS = 5;
const DEFAULT_AUTOCOMPLETE_LIMIT = 3;
const VALID_TAG_PATTERN = /^[\p{L}\p{N} _#-]+$/u;

export function normalizeTagName(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

export function getTagComparisonKey(tagName: string): string {
  return normalizeTagName(tagName).toLocaleLowerCase();
}

export function getTagValidationError(tagName: string): TagValidationError | null {
  const normalized = normalizeTagName(tagName);

  if (normalized.length < 2) {
    return { code: 'too-short', message: '최소 2자 이상 입력해주세요' };
  }

  if (normalized.length > 20) {
    return { code: 'too-long', message: '최대 20자까지 입력할 수 있습니다' };
  }

  if (!VALID_TAG_PATTERN.test(normalized)) {
    return { code: 'invalid-characters', message: '허용되지 않은 문자가 포함되어 있습니다' };
  }

  return null;
}

export function parseTagInput(input: string): TagParseResult {
  const tags: string[] = [];

  for (const fragment of input.split(',')) {
    const tag = normalizeTagName(fragment);
    if (!tag) continue;

    const error = getTagValidationError(tag);
    if (error) {
      return { tags: [], errors: [error] };
    }

    tags.push(tag);
  }

  return { tags, errors: [] };
}

export function addTagsToList(
  currentTags: string[],
  input: string,
  maxTags = DEFAULT_MAX_TAGS,
): TagParseResult {
  const parsed = parseTagInput(input);
  if (parsed.errors.length > 0) {
    return { tags: currentTags, errors: parsed.errors };
  }

  const nextTags = [...currentTags];
  const comparisonKeys = new Set(currentTags.map(getTagComparisonKey));
  const additions: string[] = [];

  for (const tag of parsed.tags) {
    const comparisonKey = getTagComparisonKey(tag);
    if (comparisonKeys.has(comparisonKey)) continue;

    comparisonKeys.add(comparisonKey);
    additions.push(tag);
  }

  if (nextTags.length + additions.length > maxTags) {
    return {
      tags: currentTags,
      errors: [{ code: 'too-many', message: `최대 ${maxTags}개까지 추가할 수 있습니다` }],
    };
  }

  return { tags: [...nextTags, ...additions], errors: [] };
}

export function removeTagFromList(currentTags: string[], tagName: string): string[] {
  const targetKey = getTagComparisonKey(tagName);
  return currentTags.filter((tag) => getTagComparisonKey(tag) !== targetKey);
}

export function hasPendingTagInput(input: string): boolean {
  return normalizeTagName(input).length > 0;
}

export function collectTagAutocompleteCandidates(notes: Note[]): TagAutocompleteCandidate[] {
  const candidates = new Map<
    string,
    {
      usageCount: number;
      latestUpdatedAt: string;
      names: Map<string, { usageCount: number; latestUpdatedAt: string }>;
    }
  >();

  for (const note of notes) {
    for (const rawTag of note.tags) {
      const tagName = normalizeTagName(rawTag);
      if (getTagValidationError(tagName)) continue;

      const comparisonKey = getTagComparisonKey(tagName);
      const candidate = candidates.get(comparisonKey) ?? {
        usageCount: 0,
        latestUpdatedAt: note.updatedAt,
        names: new Map(),
      };
      const name = candidate.names.get(tagName) ?? {
        usageCount: 0,
        latestUpdatedAt: note.updatedAt,
      };

      name.usageCount += 1;
      if (note.updatedAt > name.latestUpdatedAt) name.latestUpdatedAt = note.updatedAt;
      candidate.names.set(tagName, name);
      candidate.usageCount += 1;
      if (note.updatedAt > candidate.latestUpdatedAt) candidate.latestUpdatedAt = note.updatedAt;
      candidates.set(comparisonKey, candidate);
    }
  }

  return [...candidates.entries()].map(([comparisonKey, candidate]) => {
    const [tagName] = [...candidate.names.entries()].sort(
      ([leftName, left], [rightName, right]) =>
        right.usageCount - left.usageCount ||
        right.latestUpdatedAt.localeCompare(left.latestUpdatedAt) ||
        leftName.localeCompare(rightName),
    )[0];

    return {
      comparisonKey,
      tagName,
      usageCount: candidate.usageCount,
      latestUpdatedAt: candidate.latestUpdatedAt,
    };
  });
}

export function getTagAutocompleteSuggestions(
  candidates: TagAutocompleteCandidate[],
  input: string,
  currentTags: string[],
  limit = DEFAULT_AUTOCOMPLETE_LIMIT,
): TagAutocompleteCandidate[] {
  const inputKey = getTagComparisonKey(input);
  if (!inputKey) return [];

  const currentKeys = new Set(currentTags.map(getTagComparisonKey));

  return candidates
    .filter(
      (candidate) =>
        candidate.comparisonKey.startsWith(inputKey) && !currentKeys.has(candidate.comparisonKey),
    )
    .sort(
      (left, right) =>
        left.tagName.length - right.tagName.length ||
        right.usageCount - left.usageCount ||
        right.latestUpdatedAt.localeCompare(left.latestUpdatedAt),
    )
    .slice(0, limit);
}
