import { Note } from '../types/note';
import { API_BASE_URL } from '../config/api';

function withTags(note: Note): Note {
  return { ...note, tags: note.tags ?? [] };
}

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${API_BASE_URL}/notes`);
  if (!res.ok) throw new Error('Failed to fetch notes');
  const notes: Note[] = await res.json();
  return notes.map(withTags);
}

export async function createNote(
  note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Note> {
  const now = new Date().toISOString();
  const res = await fetch(`${API_BASE_URL}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...note, tags: note.tags ?? [], createdAt: now, updatedAt: now }),
  });
  if (!res.ok) throw new Error('Failed to create note');
  return withTags(await res.json());
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error('Failed to update note');
  return withTags(await res.json());
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete note');
}
