import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TagListView } from './TagListView';

import type { Note } from '../types/note';

function note(overrides: Partial<Note> = {}): Note {
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

describe('TagListView.render', () => {
  it('should show title, back button, search input, and tag card grid when tag mode opens', () => {
    render(<TagListView notes={[note()]} loading={false} error={null} onBackToNotes={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '태그 목록' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '노트로 돌아가기' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('태그 검색')).toBeInTheDocument();
    expect(screen.getByTestId('tag-card-grid')).toBeInTheDocument();
  });

  it('should show tag cards with display name, note count, and latest updated date when saved tags exist', () => {
    render(
      <TagListView
        notes={[
          note({ id: '1', tags: ['React'], updatedAt: '2026-01-01T00:00:00.000Z' }),
          note({ id: '2', tags: ['react'], updatedAt: '2026-01-03T00:00:00.000Z' }),
        ]}
        loading={false}
        error={null}
        onBackToNotes={vi.fn()}
      />,
    );

    const card = screen.getByTestId('tag-card-react');

    expect(within(card).getByText('react')).toBeInTheDocument();
    expect(within(card).getByText('노트 2개')).toBeInTheDocument();
    expect(within(card).getByText(/2026-01-03/)).toBeInTheDocument();
  });

  it('should show an empty state with a back button when there are no saved valid tags', () => {
    render(
      <TagListView
        notes={[note({ tags: [] })]}
        loading={false}
        error={null}
        onBackToNotes={vi.fn()}
      />,
    );

    expect(screen.getByText('저장된 태그가 없습니다')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '노트로 돌아가기' })).toBeInTheDocument();
  });

  it('should show loading state when notes are loading in tag mode', () => {
    render(<TagListView notes={[]} loading={true} error={null} onBackToNotes={vi.fn()} />);

    expect(screen.getByText('노트를 불러오는 중...')).toBeInTheDocument();
  });

  it('should show the notes error message when notes have a loading error in tag mode', () => {
    render(
      <TagListView notes={[]} loading={false} error="불러오기 실패" onBackToNotes={vi.fn()} />,
    );

    expect(screen.getByText('불러오기 실패')).toBeInTheDocument();
  });

  it('should keep rendering tag cards when an error exists with already loaded notes', () => {
    render(
      <TagListView
        notes={[note({ tags: ['React'] })]}
        loading={false}
        error="불러오기 실패"
        onBackToNotes={vi.fn()}
      />,
    );

    expect(screen.getByText('불러오기 실패')).toBeInTheDocument();
    expect(screen.getByTestId('tag-card-react')).toBeInTheDocument();
  });
});

describe('TagListView.search', () => {
  it('should show a clear button inside the search input when query has text', async () => {
    const user = userEvent.setup();
    render(<TagListView notes={[note()]} loading={false} error={null} onBackToNotes={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('태그 검색'), 're');

    expect(screen.getByRole('button', { name: '검색어 지우기' })).toBeInTheDocument();
  });

  it('should clear the query and restore the full tag list when the user clicks the clear button', async () => {
    const user = userEvent.setup();
    render(
      <TagListView
        notes={[note({ id: '1', tags: ['React'] }), note({ id: '2', tags: ['Vite'] })]}
        loading={false}
        error={null}
        onBackToNotes={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText('태그 검색'), 're');
    await user.click(screen.getByRole('button', { name: '검색어 지우기' }));

    expect(screen.getByPlaceholderText('태그 검색')).toHaveValue('');
    expect(screen.getByTestId('tag-card-react')).toBeInTheDocument();
    expect(screen.getByTestId('tag-card-vite')).toBeInTheDocument();
  });

  it('should show only the no-results message inside the list area when no tags match the query', async () => {
    const user = userEvent.setup();
    render(<TagListView notes={[note()]} loading={false} error={null} onBackToNotes={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('태그 검색'), 'zz');

    const grid = screen.getByTestId('tag-card-grid');
    expect(within(grid).getByText('검색 결과가 없습니다')).toBeInTheDocument();
    expect(within(grid).queryByTestId('tag-card-react')).not.toBeInTheDocument();
  });
});
