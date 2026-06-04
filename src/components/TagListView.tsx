import { useMemo, useState } from 'react';

import type { TagListViewProps } from '../types/tag';
import {
  collectTagSummaries,
  searchTagSummaries,
  sortTagSummariesForList,
  sortTagSummariesForSearch,
} from '../utils/tags';

function formatDate(isoDate: string): string {
  return isoDate.split('T')[0];
}

export function TagListView({ notes, loading, error, onBackToNotes }: TagListViewProps) {
  const [query, setQuery] = useState('');
  const summaries = useMemo(() => collectTagSummaries(notes), [notes]);
  const visibleSummaries = useMemo(() => {
    const searched = searchTagSummaries(summaries, query);
    return query ? sortTagSummariesForSearch(searched, query) : sortTagSummariesForList(searched);
  }, [query, summaries]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <h1 className="text-2xl font-bold text-foreground">태그 목록</h1>
        <button
          type="button"
          onClick={onBackToNotes}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-muted-foreground bg-muted hover:bg-border transition-colors cursor-pointer"
        >
          노트로 돌아가기
        </button>
      </header>

      <main className="p-8 space-y-6">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="태그 검색"
              className="flex-1 text-sm text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
            />
            {query ? (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
              >
                지우기
              </button>
            ) : null}
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">노트를 불러오는 중...</p>
          ) : null}

          {error ? <p className="text-sm text-destructive text-center py-2">{error}</p> : null}

          {!loading ? (
            <div data-testid="tag-card-grid" className="grid gap-3 sm:grid-cols-2">
              {summaries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 sm:col-span-2">
                  저장된 태그가 없습니다
                </p>
              ) : visibleSummaries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 sm:col-span-2">
                  검색 결과가 없습니다
                </p>
              ) : (
                visibleSummaries.map((summary) => (
                  <article
                    key={summary.comparisonKey}
                    data-testid={`tag-card-${summary.comparisonKey}`}
                    className="bg-card rounded-2xl p-4 border border-border transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]"
                  >
                    <h2 className="font-semibold text-sm text-foreground line-clamp-1">
                      {summary.tagName}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      노트 {summary.noteCount}개
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-2">
                      {formatDate(summary.latestUpdatedAt)}
                    </p>
                  </article>
                ))
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
