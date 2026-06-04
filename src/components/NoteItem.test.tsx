import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NoteItem } from './NoteItem';

import type { Note } from '../types/note';

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: '1',
    title: 'Tagged note',
    content: 'Body',
    tags: ['React', 'TypeScript'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderNoteItem(overrides: Partial<Note> = {}) {
  const onSelect = vi.fn();
  const onDelete = vi.fn();

  render(
    <NoteItem note={note(overrides)} isSelected={false} onSelect={onSelect} onDelete={onDelete} />,
  );

  return { onSelect, onDelete };
}

describe('NoteItem.render', () => {
  it('should show up to two tag chips when the note has saved tags', () => {
    renderNoteItem({ tags: ['React', 'TypeScript'] });

    const tagSummary = screen.getByTestId('note-item-tag-summary');

    expect(within(tagSummary).getByText('React')).toBeInTheDocument();
    expect(within(tagSummary).getByText('TypeScript')).toBeInTheDocument();
  });

  it('should show a remaining tag count when the note has more than two tags', () => {
    renderNoteItem({ tags: ['React', 'TypeScript', 'Vite'] });

    const tagSummary = screen.getByTestId('note-item-tag-summary');

    expect(within(tagSummary).getByText('React')).toBeInTheDocument();
    expect(within(tagSummary).getByText('TypeScript')).toBeInTheDocument();
    expect(within(tagSummary).getByText('+1')).toBeInTheDocument();
    expect(within(tagSummary).queryByText('Vite')).not.toBeInTheDocument();
  });

  it('should not render a tag summary area when the note has no tags', () => {
    renderNoteItem({ tags: [] });

    expect(screen.queryByTestId('note-item-tag-summary')).not.toBeInTheDocument();
    expect(screen.getByText('Tagged note')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('should keep long tag text in a single truncated line when a tag name is long', () => {
    renderNoteItem({ tags: ['VeryLongTagNameForLayout'] });

    const tagChip = screen.getByText('VeryLongTagNameForLayout');

    expect(tagChip).toHaveClass('truncate');
    expect(tagChip).toHaveClass('max-w-full');
    expect(tagChip).toHaveAttribute('title', 'VeryLongTagNameForLayout');
  });
});

describe('NoteItem.select', () => {
  it('should call onSelect for the note when the user clicks a tagged note item', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderNoteItem();

    await user.click(screen.getByText('React'));

    expect(onSelect).toHaveBeenCalledWith('1');
  });
});

describe('NoteItem.delete', () => {
  it('should call only onDelete when the user clicks the delete button in a tagged note item', async () => {
    const user = userEvent.setup();
    const { onSelect, onDelete } = renderNoteItem();

    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(onDelete).toHaveBeenCalledWith('1');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
