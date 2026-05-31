export type TagValidationErrorCode = 'too-short' | 'too-long' | 'invalid-characters' | 'too-many';

export interface TagValidationError {
  code: TagValidationErrorCode;
  message: string;
}

export interface TagParseResult {
  tags: string[];
  errors: TagValidationError[];
}

export interface TagAutocompleteCandidate {
  comparisonKey: string;
  tagName: string;
  usageCount: number;
  latestUpdatedAt: string;
}
