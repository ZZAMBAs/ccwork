export type TagValidationErrorCode = 'too-short' | 'too-long' | 'invalid-characters' | 'too-many';

export interface TagValidationError {
  code: TagValidationErrorCode;
  message: string;
}

export interface TagParseResult {
  tags: string[];
  errors: TagValidationError[];
}
