import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createNote, fetchNotes, updateNote } from './notes';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('fetchNotes', () => {
  it('should return notes with tags arrays when the server response already includes tags', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: '1',
          title: 'Tagged',
          content: 'Content',
          tags: ['React'],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    await expect(fetchNotes()).resolves.toEqual([expect.objectContaining({ tags: ['React'] })]);
  });

  it('should return notes with empty tags when the server response omits tags', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: '1',
          title: 'Past note',
          content: 'Content',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    await expect(fetchNotes()).resolves.toEqual([expect.objectContaining({ tags: [] })]);
  });
});

describe('createNote', () => {
  it('should send tags as an empty array when a new note is saved without tags', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '1',
        title: 'New',
        content: '',
        tags: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    });

    await createNote({ title: 'New', content: '' } as Parameters<typeof createNote>[0]);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({ tags: [] }),
    );
  });
});

describe('updateNote', () => {
  it('should send changed tags and refresh updatedAt when only tags are changed', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '1',
        title: 'Tagged',
        content: '',
        tags: ['React'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }),
    });

    await updateNote('1', { tags: ['React'] });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        tags: ['React'],
        updatedAt: expect.any(String),
      }),
    );
  });
});
