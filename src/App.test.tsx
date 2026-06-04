import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
