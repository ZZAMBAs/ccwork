import { render, screen, waitFor, within } from '@testing-library/react';
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
    tags: ['React'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

async function renderEditor({
  selectedNote = note(),
  isCreating = false,
}: {
  selectedNote?: Record<string, unknown>;
  isCreating?: boolean;
} = {}) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => (isCreating ? [] : [selectedNote]),
  });

  const onDone = vi.fn();
  render(
    <NotesProvider>
      <NoteEditor
        selectedNoteId={isCreating ? null : '1'}
        isCreating={isCreating}
        onDone={onDone}
      />
    </NotesProvider>,
  );

  await waitFor(() => expect(fetchMock).toHaveBeenCalled());

  return { onDone };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('NoteEditor.render', () => {
  it('should show the tag input area between the title and content fields when editing or creating a note', async () => {
    await renderEditor();

    const textboxes = screen.getAllByRole('textbox');
    const tagInput = screen.getByRole('textbox', { name: /tag/i });

    expect(textboxes.indexOf(tagInput)).toBeGreaterThan(0);
    expect(textboxes.indexOf(tagInput)).toBeLessThan(textboxes.length - 1);
  });
});

describe('NoteEditor.addTag', () => {
  it('should render an added tag as a chip when the user presses Enter', async () => {
    const user = userEvent.setup();
    await renderEditor();

    await user.type(screen.getByRole('textbox', { name: /tag/i }), 'React{Enter}');

    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('should render an added tag as a chip when the user clicks the add button', async () => {
    const user = userEvent.setup();
    await renderEditor();

    await user.type(screen.getByRole('textbox', { name: /tag/i }), 'React');
    await user.click(screen.getByRole('button', { name: /add|추가/i }));

    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('should show the first inline validation error and keep the tag list unchanged when invalid input is submitted', async () => {
    const user = userEvent.setup();
    await renderEditor();

    await user.type(screen.getByRole('textbox', { name: /tag/i }), 'R{Enter}');

    expect(screen.getByText(/최소|too short/i)).toBeInTheDocument();
    expect(screen.queryByText('R')).not.toBeInTheDocument();
  });
});

describe('NoteEditor.removeTag', () => {
  it('should remove the selected tag chip from the current note draft when the user clicks its remove button', async () => {
    const user = userEvent.setup();
    await renderEditor();

    const chip =
      screen.getByText('React').closest('[data-testid="tag-chip"]') ??
      screen.getByText('React').parentElement;
    expect(chip).not.toBeNull();

    await user.click(within(chip as HTMLElement).getByRole('button', { name: /remove|삭제/i }));

    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });
});

describe('NoteEditor.loadNote', () => {
  it('should initialize tags as an empty array when the selected persisted note has no tags field', async () => {
    await renderEditor({ selectedNote: note({ tags: undefined }) });

    expect(screen.queryAllByTestId('tag-chip')).toHaveLength(0);
  });

  it('should render invalid persisted tags as warning chips when an existing note contains invalid tag values', async () => {
    await renderEditor({ selectedNote: note({ tags: ['R'] }) });

    expect(screen.getByText('R')).toHaveAttribute('data-variant', 'warning');
  });
});

describe('NoteEditor.dirtyState', () => {
  it('should enable the save button when only tags are added or removed', async () => {
    const user = userEvent.setup();
    await renderEditor({ selectedNote: note({ tags: [] }) });

    const saveButton = screen.getByRole('button', { name: /save|저장/i });
    await user.type(screen.getByRole('textbox', { name: /tag/i }), 'React{Enter}');

    expect(saveButton).toBeEnabled();
  });
});

describe('NoteEditor.save', () => {
  it('should persist added tags through updateNote when the user saves an existing note', async () => {
    const user = userEvent.setup();
    await renderEditor({ selectedNote: note({ tags: [] }) });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => note({ tags: ['React'] }) });

    await user.type(screen.getByRole('textbox', { name: /tag/i }), 'React{Enter}');
    await user.click(screen.getByRole('button', { name: /save|저장/i }));

    await waitFor(() => {
      expect(JSON.parse(fetchMock.mock.calls.at(-1)?.[1].body)).toEqual(
        expect.objectContaining({ tags: ['React'] }),
      );
    });
  });

  it('should persist removed tags through updateNote when the user saves an existing note', async () => {
    const user = userEvent.setup();
    await renderEditor();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => note({ tags: [] }) });

    const chip =
      screen.getByText('React').closest('[data-testid="tag-chip"]') ??
      screen.getByText('React').parentElement;
    await user.click(within(chip as HTMLElement).getByRole('button', { name: /remove|삭제/i }));
    await user.click(screen.getByRole('button', { name: /save|저장/i }));

    await waitFor(() => {
      expect(JSON.parse(fetchMock.mock.calls.at(-1)?.[1].body)).toEqual(
        expect.objectContaining({ tags: [] }),
      );
    });
  });

  it('should clear pending tag input and inline tag errors when save succeeds', async () => {
    const user = userEvent.setup();
    await renderEditor();
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => note({ tags: ['React'] }) });

    const tagInput = screen.getByRole('textbox', { name: /tag/i });
    await user.type(tagInput, 'React{Enter}');
    await user.click(screen.getByRole('button', { name: /save|저장/i }));

    await waitFor(() => expect(tagInput).toHaveValue(''));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should send tags as an empty array when a new note is saved without adding tags', async () => {
    const user = userEvent.setup();
    await renderEditor({ isCreating: true });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => note({ tags: [] }) });

    await user.type(screen.getAllByRole('textbox')[0], 'New note');
    await user.click(screen.getByRole('button', { name: /save|저장/i }));

    await waitFor(() => {
      expect(JSON.parse(fetchMock.mock.calls.at(-1)?.[1].body)).toEqual(
        expect.objectContaining({ tags: [] }),
      );
    });
  });

  it('should not call createNote or updateNote and should show pending-tag guidance when tag input has unadded text', async () => {
    const user = userEvent.setup();
    await renderEditor();

    await user.type(screen.getByRole('textbox', { name: /tag/i }), 'React');
    await user.click(screen.getByRole('button', { name: /save|저장/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toHaveTextContent(/미추가|unadded|pending/i);
  });

  it('should preserve title, content, tag chips, and retryable save state when the save request fails', async () => {
    const user = userEvent.setup();
    await renderEditor();
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    await user.click(screen.getByRole('button', { name: /save|저장/i }));

    expect(await screen.findByDisplayValue('Tagged note')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Body')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save|저장/i })).toBeEnabled();
  });
});

describe('NoteEditor.pendingTagModal', () => {
  it('should not automatically convert pending input into a tag when the pending-tag guidance is shown', async () => {
    const user = userEvent.setup();
    await renderEditor();

    await user.type(screen.getByRole('textbox', { name: /tag/i }), 'React');
    await user.click(screen.getByRole('button', { name: /save|저장/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByTestId('tag-chip')).not.toHaveTextContent('React');
  });
});
