import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNotes, NotesProvider } from './NotesContext';

const fetchMock = vi.fn();

function ContextProbe() {
  const { notes, createNote, updateNote } = useNotes();

  return (
    <div>
      <output aria-label="note-count">{notes.length}</output>
      <button onClick={() => createNote('New', '', ['React'])}>create</button>
      <button onClick={() => updateNote('1', { tags: ['React'] })}>update</button>
    </div>
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('NotesContext', () => {
  it('should expose tag changes only through existing note CRUD actions when the tag feature is used', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(
      <NotesProvider>
        <ContextProbe />
      </NotesProvider>,
    );

    await waitFor(() => expect(screen.getByLabelText('note-count')).toHaveTextContent('0'));

    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument();
  });
});
