import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NoteEditor } from './NoteEditor';
import { NotesProvider } from '../context/NotesContext';

const fetchMock = vi.fn();

function note(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    title: 'Tagged note',
    content: 'Body',
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

async function renderAutocompleteEditor({
  selectedNote = note(),
  notes = [selectedNote],
}: {
  selectedNote?: Record<string, unknown>;
  notes?: Record<string, unknown>[];
} = {}) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => notes,
  });

  render(
    <NotesProvider>
      <NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />
    </NotesProvider>,
  );

  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('NoteEditor.autocomplete', () => {
  it('should show suggestions derived from saved notes when the user starts typing a matching prefix', async () => {
    const user = userEvent.setup();
    await renderAutocompleteEditor({
      notes: [note(), note({ id: '2', tags: ['React'] })],
    });

    await user.type(screen.getByRole('textbox', { name: /tag/i }), 're');

    expect(screen.getByRole('button', { name: 'React' })).toBeInTheDocument();
  });
});

describe('NoteEditor.selectAutocompleteSuggestion', () => {
  it('should add the clicked suggestion as a local tag chip when the user clicks an autocomplete suggestion', async () => {
    const user = userEvent.setup();
    await renderAutocompleteEditor({
      notes: [note(), note({ id: '2', tags: ['React'] })],
    });

    await user.type(screen.getByRole('textbox', { name: /tag/i }), 're');
    await user.click(screen.getByRole('button', { name: 'React' }));

    expect(screen.getByTestId('tag-chip')).toHaveTextContent('React');
  });

  it('should add the active suggestion as a local tag chip when the user selects an autocomplete suggestion with the keyboard', async () => {
    const user = userEvent.setup();
    await renderAutocompleteEditor({
      notes: [note(), note({ id: '2', tags: ['React'] })],
    });

    await user.type(screen.getByRole('textbox', { name: /tag/i }), 're');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(screen.getByTestId('tag-chip')).toHaveTextContent('React');
  });

  it('should show the existing inline max-tag error and keep tags unchanged when selecting a suggestion would exceed five tags', async () => {
    const user = userEvent.setup();
    const existingTags = ['React', 'Reason', 'Remix', 'Relay', 'Recoil'];
    await renderAutocompleteEditor({
      selectedNote: note({ tags: existingTags }),
      notes: [note({ tags: existingTags }), note({ id: '2', tags: ['Redux'] })],
    });

    await user.type(screen.getByRole('textbox', { name: /tag/i }), 'red');
    await user.click(screen.getByRole('button', { name: 'Redux' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/최대 5개/);
    expect(screen.getAllByTestId('tag-chip')).toHaveLength(5);
    expect(screen.queryByText('Redux')).not.toBeInTheDocument();
  });
});

describe('NoteEditor.saveAutocompleteSuggestion', () => {
  it('should persist a tag selected from autocomplete when the user clicks save', async () => {
    const user = userEvent.setup();
    await renderAutocompleteEditor({
      notes: [note(), note({ id: '2', tags: ['React'] })],
    });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => note({ tags: ['React'] }) });

    await user.type(screen.getByRole('textbox', { name: /tag/i }), 're');
    await user.click(screen.getByRole('button', { name: 'React' }));
    await user.click(screen.getByRole('button', { name: /save|저장/i }));

    await waitFor(() => {
      expect(JSON.parse(fetchMock.mock.calls.at(-1)?.[1].body)).toEqual(
        expect.objectContaining({ tags: ['React'] }),
      );
    });
  });
});
