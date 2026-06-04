import type { Note } from './note';

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

export interface TagSummary {
  comparisonKey: string;
  tagName: string;
  noteCount: number;
  latestUpdatedAt: string;
}

export interface TagListViewProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onBackToNotes: () => void;
}
