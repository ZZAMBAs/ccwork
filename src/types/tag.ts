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

export type TagViewMode = 'list' | 'detail';

export interface TaggedNoteCard {
  id: string;
  title: string;
  contentPreview: string;
  tags: string[];
  updatedAt: string;
}

export interface TagDetailViewProps {
  tag: TagSummary;
  notes: TaggedNoteCard[];
  onBackToTagList: () => void;
  onBackToNotes: () => void;
  onSelectNote: (noteId: string) => void;
}

export interface TagListViewProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onBackToNotes: () => void;
  onSelectNote: (noteId: string) => void;
}
