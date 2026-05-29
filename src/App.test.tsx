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
