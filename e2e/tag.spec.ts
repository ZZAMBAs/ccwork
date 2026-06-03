import fs from 'node:fs';
import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const fixturePath = path.resolve(__dirname, 'fixtures', 'tag-db.json');
const tmpDbPath = path.resolve(__dirname, '.tmp', 'db.json');
const targetNoteUrl = 'http://localhost:3001/notes/tag-target';
const sourceNoteUrl = 'http://localhost:3001/notes/tag-source-react';
const targetNote = {
  id: 'tag-target',
  title: 'E2E 태그 편집 대상 노트',
  content: 'E2E 테스트에서 태그를 편집할 노트입니다.',
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const sourceNote = {
  id: 'tag-source-react',
  title: 'E2E React 태그 원본 노트',
  content: '자동완성에서 재사용할 태그를 제공하는 노트입니다.',
  tags: ['React'],
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

function resetDb() {
  fs.mkdirSync(path.dirname(tmpDbPath), { recursive: true });
  fs.copyFileSync(fixturePath, tmpDbPath);
}

async function openTargetNote(page: Page) {
  await page.goto('/');
  await page.getByText('E2E 태그 편집 대상 노트').click();
  await expect(page.locator('input').first()).toHaveValue('E2E 태그 편집 대상 노트');
}

async function saveNote(page: Page) {
  await page.locator('textarea').locator('xpath=following::button[1]').click();
}

async function resetServerState(request: APIRequestContext) {
  resetDb();
  await expect
    .poll(async () => {
      const targetResponse = await request.put(targetNoteUrl, { data: targetNote });
      const sourceResponse = await request.put(sourceNoteUrl, { data: sourceNote });
      return targetResponse.ok() && sourceResponse.ok();
    })
    .toBe(true);
}

test.beforeEach(async ({ request }) => {
  await resetServerState(request);
});

test.describe('태그 기능', () => {
  test('기존 노트에 직접 입력한 태그를 저장하면 서버에 반영된다', async ({ page, request }) => {
    await test.step('태그를 편집할 기존 노트를 연다', async () => {
      await openTargetNote(page);
    });

    await test.step('태그 입력창에 Vite를 입력하고 Enter로 추가한다', async () => {
      await page.getByRole('textbox', { name: /tag/i }).fill('Vite');
      await page.keyboard.press('Enter');
    });

    await test.step('추가한 Vite 태그 칩이 화면에 보인다', async () => {
      await expect(page.getByTestId('tag-chip').filter({ hasText: 'Vite' })).toBeVisible();
    });

    await test.step('노트를 저장한다', async () => {
      await saveNote(page);
    });

    await test.step('서버에 Vite 태그가 저장되었는지 확인한다', async () => {
      await expect
        .poll(async () => {
          const response = await request.get(targetNoteUrl);
          const note = await response.json();
          return note.tags;
        })
        .toEqual(['Vite']);
    });
  });

  test('자동완성에서 선택한 기존 태그를 저장하면 서버에 반영된다', async ({ page, request }) => {
    await test.step('태그를 편집할 기존 노트를 연다', async () => {
      await openTargetNote(page);
    });

    await test.step('태그 입력창에 re를 입력하고 React 자동완성 항목을 선택한다', async () => {
      await page.getByRole('textbox', { name: /tag/i }).fill('re');
      await page.getByRole('button', { name: 'React' }).click();
    });

    await test.step('선택한 React 태그 칩이 화면에 보인다', async () => {
      await expect(page.getByTestId('tag-chip').filter({ hasText: 'React' })).toBeVisible();
    });

    await test.step('노트를 저장한다', async () => {
      await saveNote(page);
    });

    await test.step('서버에 React 태그가 저장되었는지 확인한다', async () => {
      await expect
        .poll(async () => {
          const response = await request.get(targetNoteUrl);
          const note = await response.json();
          return note.tags;
        })
        .toEqual(['React']);
    });
  });
});
