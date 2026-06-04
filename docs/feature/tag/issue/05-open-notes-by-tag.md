# Issue 5. 태그별 노트를 모아 보고 노트로 이동하기

## 목표

사용자가 특정 태그가 붙은 노트들을 모아 보고, 노트 카드 클릭으로 일반 노트 편집 화면으로 이동할 수 있게 한다.

## 이유

태그 탐색의 최종 가치는 태그별로 노트를 좁혀 보고 원하는 노트로 돌아가는 흐름이다. 목록 화면과 편집 화면 사이의 이동 규칙을 명확히 연결해야 한다.

## 설명

기존에는 특정 분류의 노트를 사용자가 직접 찾아야 하지만, 이 변경 이후에는 태그 카드를 클릭해 같은 태그가 붙은 노트만 모아 볼 수 있다. 사용자는 상세 목록에서 원하는 노트를 클릭해 곧바로 일반 편집 화면으로 돌아간다.

태그 모드 안에 목록/상세 하위 상태와 선택된 태그 키를 둔다. 상세 화면은 태그 집계 결과와 `notes`를 기준으로 해당 태그가 붙은 노트만 필터링하고, 노트 카드는 표시 전용 데이터로 구성한다. 노트 카드 클릭 시 태그 모드를 종료하고 기존 노트 선택 상태를 갱신하며, URL 라우팅은 추가하지 않는다.

## Acceptance Criteria

- 사용자가 태그 목록에서 태그 카드를 클릭하면, 해당 태그의 상세 화면으로 이동해야 한다.
- 사용자가 태그 상세 화면에 진입하면, 대표 태그명, 태그 목록으로 돌아가기 버튼, 노트로 돌아가기 버튼, 포함 노트 수, 노트 카드 목록을 볼 수 있어야 한다.
- 사용자가 태그 상세의 노트 목록을 보면, 해당 태그가 붙은 노트만 최근 저장일이 최신인 순서로 표시되어야 한다.
- 사용자가 태그 상세의 노트 카드를 보면, 제목, 본문 미리보기, 최근 저장일, 전체 태그 칩이 표시되어야 한다.
- 제목이 비어 있는 노트가 상세 목록에 있으면, 사용자는 해당 카드 제목으로 `(제목 없음)`을 볼 수 있어야 한다.
- 본문이 비어 있는 노트가 상세 목록에 있으면, 해당 카드에는 빈 본문 미리보기 영역이 표시되지 않아야 한다.
- 사용자가 태그 상세의 노트 카드를 클릭하면, 태그 모드가 종료되고 해당 노트가 선택된 일반 노트 편집 화면이 표시되어야 한다.
- 사용자가 새 노트 작성 상태에서 태그 상세 노트 카드를 클릭하면, 새 노트 작성 상태는 종료되고 클릭한 노트가 선택되어야 한다.
- 사용자가 태그 목록으로 돌아가기 버튼을 클릭하면, 태그 목록 화면으로 돌아가야 한다.
- 사용자가 노트로 돌아가기 버튼을 클릭하면, 태그 모드가 완전히 종료되고 일반 노트 화면이 표시되어야 한다.
- 사용자가 태그 상세를 보고 있는 동안 해당 태그가 모든 노트에서 사라지면, 태그 목록 화면으로 이동하고 `해당 태그가 더 이상 없습니다` 안내가 표시되어야 한다.
- 사용자가 태그 상세 화면을 볼 때, 상세 내 노트 검색 입력이나 URL 기반 `/tags` 경로는 제공되지 않아야 한다.

## 확정 시그니처

### 공용 타입

```ts
export type TagViewMode = 'list' | 'detail';

export interface TaggedNoteCard {
  id: string;
  title: string;
  contentPreview: string;
  tags: string[];
  updatedAt: string;
}

export interface TagDetailViewProps {
  tag: TagSummary;
  notes: TaggedNoteCard[];
  onBackToTagList: () => void;
  onBackToNotes: () => void;
  onSelectNote: (noteId: string) => void;
}

export interface TagListViewProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onBackToNotes: () => void;
  onSelectNote: (noteId: string) => void;
}
```

- `TagViewMode`는 `TagListView` 내부의 목록/상세 하위 상태에 사용한다.
- `TaggedNoteCard`는 태그 상세 노트 카드 표시 전용 데이터이며, 제목이 비어 있으면 `title`을 `(제목 없음)`으로 확정한다.
- `contentPreview`는 `note.content.trim()` 결과를 사용하고, 빈 문자열이면 상세 카드에서 본문 미리보기 영역을 렌더링하지 않는다.

### 순수 함수

```ts
export function getNotesByTag(notes: Note[], comparisonKey: string): TaggedNoteCard[];
```

- `comparisonKey`와 일치하는 유효 태그가 있는 노트만 반환한다.
- 정렬은 `updatedAt` 내림차순이며, 같은 시각이면 `title` 오름차순으로 안정화한다.
- 노트의 모든 원본 `tags`를 카드 데이터에 유지한다.
- API 요청이나 Context 변경은 수행하지 않는다.
- 오류를 던지지 않고, 일치하는 노트가 없으면 빈 배열을 반환한다.

### 컴포넌트 동작 계약

- `TagListView`는 `collectTagSummaries(notes)`로 태그 목록을 파생하고, 태그 카드 클릭 시 내부 상태를 `detail`로 바꾸며 선택 태그 `comparisonKey`를 저장한다.
- `TagListView`는 상세 화면에서 선택 태그 요약이 사라지면 목록 화면으로 돌아가고 `해당 태그가 더 이상 없습니다` 안내를 표시한다.
- `TagListView`는 `onSelectNote(noteId)`를 태그 상세 카드 선택 시 호출한다.
- `App`의 `handleSelectTaggedNote(noteId: string): void`는 태그 모드를 종료하고, `isCreating`을 `false`로 바꾸며, `selectedNoteId`를 `noteId`로 갱신한다.
- `TagDetailView`는 상세 내 노트 검색 입력을 받지 않으며 URL 라우팅을 추가하지 않는다.
- 별도 `tags` API 리소스, JSON Server 요청, Context CRUD 액션 추가는 없다.

## 테스트 시나리오

- [정상] TagListView.openTagDetail — should show the tag detail heading, navigation buttons, note count, and note cards when the user clicks a tag card
- [정상] getNotesByTag — should return only notes with the selected tag sorted by latest updatedAt and mapped with fallback title, optional content preview, updated date, and all tag chips when matching notes exist
- [정상] App.selectTaggedNote — should exit tag mode, end creating state, and select the clicked note in the normal editor when the user clicks a note card in tag detail
- [경계] TagListView.syncSelectedTag — should return to the tag list and show the missing-tag notice when the selected tag disappears from all notes while detail is open
