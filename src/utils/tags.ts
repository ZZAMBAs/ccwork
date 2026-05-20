import type { TagParseResult, TagValidationError } from '../types/tag';

const DEFAULT_MAX_TAGS = 5;
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
