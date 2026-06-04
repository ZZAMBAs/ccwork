import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

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

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App.save', () => {
  it('should keep the saved existing note selected and visible after save succeeds', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [note()],
    });

    render(<App />);

    await user.click(await screen.findByText('Tagged note'));

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => note({ content: 'Updated body' }),
    });

    const contentField = screen.getByDisplayValue('Body');
    await user.clear(contentField);
    await user.type(contentField, 'Updated body');
    await user.click(screen.getByRole('button', { name: /save|저장/i }));

    await waitFor(() => {
      expect(screen.queryByText('노트를 선택하거나 새 노트를 만드세요')).not.toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Tagged note')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Updated body')).toBeInTheDocument();
  });
});

describe('Layout.render', () => {
  it('should show the tag button to the left of the new note button when the app header renders', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [note()],
    });

    render(<App />);

    await screen.findByText('Tagged note');
    const tagButton = screen.getByRole('button', { name: '태그' });
    const newNoteButton = screen.getByRole('button', { name: '+ 새 노트' });

    expect(tagButton.compareDocumentPosition(newNoteButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});

describe('App.openTags', () => {
  it('should show the tag list screen without changing the browser URL when the user clicks the tag button', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [note()],
    });
    const initialUrl = window.location.href;

    render(<App />);

    await user.click(await screen.findByRole('button', { name: '태그' }));

    expect(window.location.href).toBe(initialUrl);
    expect(screen.getByRole('heading', { name: '태그 목록' })).toBeInTheDocument();
  });

  it('should hide the sidebar note list and note editor when tag mode is active', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [note()],
    });

    render(<App />);

    await screen.findByText('Tagged note');
    await user.click(screen.getByRole('button', { name: '태그' }));

    expect(screen.queryByText('Tagged note')).not.toBeInTheDocument();
    expect(screen.queryByText('노트를 선택하거나 새 노트를 만드세요')).not.toBeInTheDocument();
  });

  it('should reset the previous search state when the user exits and re-enters tag mode', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [note(), note({ id: '2', tags: ['Vite'] })],
    });

    render(<App />);

    await user.click(await screen.findByRole('button', { name: '태그' }));
    await user.type(screen.getByPlaceholderText('태그 검색'), 'zz');
    expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '노트로 돌아가기' }));
    await user.click(screen.getByRole('button', { name: '태그' }));

    expect(screen.getByPlaceholderText('태그 검색')).toHaveValue('');
    expect(screen.getByTestId('tag-card-react')).toBeInTheDocument();
  });
});

describe('App.backToNotes', () => {
  it('should restore the previously selected note when the user returns from tag mode and that note still exists', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [note({ id: '1', title: 'Note A' }), note({ id: '2', title: 'Note B' })],
    });

    render(<App />);

    await user.click(await screen.findByText('Note A'));
    await user.click(screen.getByRole('button', { name: '태그' }));
    await user.click(screen.getByRole('button', { name: '노트로 돌아가기' }));

    expect(screen.getByDisplayValue('Note A')).toBeInTheDocument();
  });
});

describe('App.selectTaggedNote', () => {
  it('should exit tag mode, end creating state, and select the clicked note in the normal editor when the user clicks a note card in tag detail', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        note({
          id: 'react-note',
          title: 'React detail note',
          content: 'Selected from tag detail',
          tags: ['React'],
        }),
      ],
    });

    render(<App />);

    await screen.findByText('React detail note');
    await user.click(screen.getByRole('button', { name: '+ 새 노트' }));
    expect(screen.getByText('새 노트')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '태그' }));
    await user.click(screen.getByTestId('tag-card-react'));
    await user.click(screen.getByText('React detail note'));

    expect(screen.queryByRole('heading', { name: '태그 목록' })).not.toBeInTheDocument();
    expect(screen.queryByText('새 노트')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('React detail note')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Selected from tag detail')).toBeInTheDocument();
  });
});

describe('App.guardUnsavedNavigation', () => {
  it('should show the unsaved changes dialog when the user changes title, content, saved tags, or pending tag input before selecting another note, creating a note, or opening tags', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        note({ id: 'title-note', title: 'Title draft', content: 'Title body', tags: ['React'] }),
        note({
          id: 'content-note',
          title: 'Content draft',
          content: 'Content body',
          tags: ['Vite'],
        }),
        note({ id: 'tag-note', title: 'Tag draft', content: 'Tag body', tags: ['TypeScript'] }),
        note({ id: 'pending-tag-note', title: 'Pending tag', content: 'Pending body', tags: [] }),
        note({ id: 'target-note', title: 'Target note', content: 'Target body', tags: ['React'] }),
      ],
    });

    render(<App />);

    await user.click(await screen.findByText('Title draft'));
    const titleField = screen.getByDisplayValue('Title draft');
    await user.clear(titleField);
    await user.type(titleField, 'Unsaved title');
    await user.click(screen.getByText('Target note'));

    let dialog = screen.getByRole('dialog', { name: /미저장|unsaved/i });
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /계속|continue/i }));

    await user.click(screen.getByText('Content draft'));
    const contentField = screen.getByDisplayValue('Content body');
    await user.clear(contentField);
    await user.type(contentField, 'Unsaved content');
    await user.click(screen.getByRole('button', { name: '+ 새 노트' }));

    dialog = screen.getByRole('dialog', { name: /미저장|unsaved/i });
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /계속|continue/i }));

    await user.click(screen.getByText('Tag draft'));
    await user.type(screen.getByRole('textbox', { name: /tag/i }), 'Solid{Enter}');
    await user.click(screen.getByRole('button', { name: '태그' }));

    dialog = screen.getByRole('dialog', { name: /미저장|unsaved/i });
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /계속|continue/i }));
    await user.click(screen.getByRole('button', { name: '노트로 돌아가기' }));

    await user.click(screen.getByText('Pending tag'));
    await user.type(screen.getByRole('textbox', { name: /tag/i }), 'DraftTag');
    await user.click(screen.getByText('Target note'));

    expect(screen.getByRole('dialog', { name: /미저장|unsaved/i })).toBeInTheDocument();
  });

  it('should show the unsaved changes dialog when the user removes a saved tag before opening tags', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [note({ id: 'tag-note', title: 'Tag draft', tags: ['TypeScript'] })],
    });

    render(<App />);

    await user.click(await screen.findByText('Tag draft'));
    await user.click(screen.getByRole('button', { name: 'TypeScript 삭제' }));
    await user.click(screen.getByRole('button', { name: '태그' }));

    expect(screen.getByRole('dialog', { name: /미저장|unsaved/i })).toBeInTheDocument();
  });
});

describe('App.confirmUnsavedNavigation', () => {
  it('should discard the current draft and execute the queued navigation when the user chooses to continue, including entering tag mode and then selecting a tagged note without an additional dialog', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        note({
          id: 'react-note',
          title: 'React detail note',
          content: 'Selected from tag detail',
          tags: ['React'],
        }),
      ],
    });

    render(<App />);

    await user.click(await screen.findByText('React detail note'));
    const titleField = screen.getByDisplayValue('React detail note');
    await user.clear(titleField);
    await user.type(titleField, 'Unsaved title');
    await user.click(screen.getByRole('button', { name: '태그' }));
    await user.click(
      within(screen.getByRole('dialog', { name: /미저장|unsaved/i })).getByRole('button', {
        name: /계속|continue/i,
      }),
    );

    expect(screen.getByRole('heading', { name: '태그 목록' })).toBeInTheDocument();

    await user.click(screen.getByTestId('tag-card-react'));
    await user.click(screen.getByText('React detail note'));

    expect(screen.queryByRole('dialog', { name: /미저장|unsaved/i })).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('React detail note')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Unsaved title')).not.toBeInTheDocument();
  });
});

describe('App.cancelUnsavedNavigation', () => {
  it('should keep the current editor selected and preserve entered title, content, and tags when the user cancels the unsaved changes dialog', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        note({ id: 'draft-note', title: 'Draft note', content: 'Draft body', tags: ['React'] }),
        note({ id: 'target-note', title: 'Target note', content: 'Target body', tags: ['Vite'] }),
      ],
    });

    render(<App />);

    await user.click(await screen.findByText('Draft note'));
    const titleField = screen.getByDisplayValue('Draft note');
    const contentField = screen.getByDisplayValue('Draft body');
    await user.clear(titleField);
    await user.type(titleField, 'Unsaved title');
    await user.clear(contentField);
    await user.type(contentField, 'Unsaved body');
    await user.type(screen.getByRole('textbox', { name: /tag/i }), 'Solid{Enter}');
    await user.click(screen.getByText('Target note'));
    await user.click(
      within(screen.getByRole('dialog', { name: /미저장|unsaved/i })).getByRole('button', {
        name: /취소|cancel/i,
      }),
    );

    expect(screen.getByDisplayValue('Unsaved title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Unsaved body')).toBeInTheDocument();
    expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    expect(screen.getByText('Solid')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Target note')).not.toBeInTheDocument();
  });
});

describe('App.beforeUnloadGuard', () => {
  it('should register the browser beforeunload warning only while unsaved editor changes exist and should navigate immediately without a dialog when there are no unsaved changes', async () => {
    const user = userEvent.setup();
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        note({ id: 'clean-note', title: 'Clean note', content: 'Clean body', tags: ['React'] }),
        note({ id: 'target-note', title: 'Target note', content: 'Target body', tags: ['Vite'] }),
      ],
    });

    render(<App />);

    await user.click(await screen.findByText('Clean note'));
    await user.click(screen.getByText('Target note'));

    expect(screen.queryByRole('dialog', { name: /미저장|unsaved/i })).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Target note')).toBeInTheDocument();

    const titleField = screen.getByDisplayValue('Target note');
    await user.clear(titleField);
    await user.type(titleField, 'Unsaved title');

    await waitFor(() => {
      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => note({ id: 'target-note', title: 'Unsaved title' }),
    });
    await user.click(screen.getByRole('button', { name: /save|저장/i }));

    await waitFor(() => {
      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
  });
});
