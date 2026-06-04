export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteEditorDraftSnapshot {
  title: string;
  content: string;
  tags: string[];
  tagInput: string;
}
