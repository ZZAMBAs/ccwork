# Issue 4. 태그 목록을 검색하고 탐색하기

## 확정 시그니처

```ts
// src/types/tag.ts
export interface TagSummary {
  comparisonKey: string;
  tagName: string;
  noteCount: number;
  latestUpdatedAt: string;
}

export interface TagListViewProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onBackToNotes: () => void;
}

// src/utils/tags.ts
export function collectTagSummaries(notes: Note[]): TagSummary[];
export function searchTagSummaries(summaries: TagSummary[], query: string): TagSummary[];
export function sortTagSummariesForList(summaries: TagSummary[]): TagSummary[];
export function sortTagSummariesForSearch(summaries: TagSummary[], query: string): TagSummary[];

// src/components/TagListView.tsx
export function TagListView(props: TagListViewProps): JSX.Element;

// src/components/Layout.tsx
interface LayoutProps {
  onNewNote: () => void;
  onOpenTags: () => void;
  sidebar: ReactNode;
  main: ReactNode;
}

// src/App.tsx 내부 상태
type AppMode = 'notes' | 'tags';
const [mode, setMode] = useState<AppMode>('notes');
const [lastSelectedNoteIdBeforeTags, setLastSelectedNoteIdBeforeTags] = useState<string | null>(
  null,
);
```

- 순수 함수는 오류를 던지지 않고 유효하지 않은 저장 태그만 제외한다.
- `TagListView`는 `loading`, `error`, 빈 태그, 검색 결과 없음 상태를 표시한다.
- 오류가 있어도 `notes`가 있으면 태그 목록 계산과 렌더링을 계속한다.
- `onBackToNotes`는 태그 모드를 종료하고, 진입 직전 노트가 현재 `notes`에 남아 있으면 다시 선택한다.

## 목표

사용자가 태그 모드에 진입해 전체 태그 목록을 보고 prefix 검색으로 원하는 태그를 찾을 수 있게 한다.

## 이유

태그 목록은 저장된 노트의 태그를 모아 사용자가 탐색을 시작하는 화면이다. 집계, 대표 표시명, 정렬, 검색, 빈 상태가 목록 탐색이라는 하나의 사용자 흐름 안에서 검증되어야 한다.

## 설명

기존에는 노트 목록만 탐색할 수 있지만, 이 변경 이후에는 사용자가 태그 모드로 전환해 전체 태그를 한 화면에서 보고 검색할 수 있다. 사용자는 태그명, 포함 노트 수, 최근 저장일을 기준으로 관심 있는 태그를 찾는 흐름을 갖게 된다.

`App`에 일반 노트 모드와 태그 모드를 구분하는 내부 상태를 추가하고, 태그 버튼으로 태그 목록 화면에 진입한다. 태그 목록 데이터는 별도 서버 리소스 없이 저장된 `notes`에서 파생하며, 집계/대표 표시명/정렬/검색은 순수 함수로 계산한다. 태그 목록 화면은 로딩, 오류, 빈 상태, 검색 결과 없음 상태를 기존 앱 상태와 연결해 표시한다.

## Acceptance Criteria

- 사용자가 사이드바 상단을 보면, `태그` 버튼이 `새 노트` 버튼의 좌측에 표시되어야 한다.
- 사용자가 `태그` 버튼을 클릭하면, 브라우저 URL은 바뀌지 않고 전체 화면 태그 목록 화면이 표시되어야 한다.
- 태그 목록 화면이 표시되면, 기존 사이드바와 노트 편집 화면은 보이지 않아야 한다.
- 사용자가 태그 목록 화면에 진입하면, 화면 제목, 노트로 돌아가기 버튼, 검색 입력, 태그 카드 그리드를 볼 수 있어야 한다.
- 저장된 태그가 있는 상태에서 사용자가 태그 목록 화면을 보면, 각 태그 카드에 대표 태그명, 포함 노트 수, 최근 저장일이 표시되어야 한다.
- 같은 노트에 같은 비교 키의 태그가 중복 저장된 상황에서 사용자가 태그 목록을 보면, 해당 태그의 포함 노트 수는 1개로 계산되어야 한다.
- 유효하지 않은 태그가 저장된 노트가 있는 상황에서 사용자가 태그 목록을 보면, 해당 유효하지 않은 태그는 태그 카드로 표시되지 않아야 한다.
- `React`와 `react`가 여러 노트에 저장된 상황에서 사용자가 태그 목록을 보면, 더 많이 사용된 표기가 대표 태그명으로 표시되어야 한다.
- 대표 표기 사용 횟수가 같은 상황에서 사용자가 태그 목록을 보면, 더 최근에 저장된 표기가 대표 태그명으로 표시되어야 한다.
- 사용자가 검색 입력에 `re`를 입력하면, 대표 태그명이 `re`로 시작하는 태그 카드만 대소문자 구분 없이 남아야 한다.
- 사용자가 검색어를 입력하면, 검색 입력 안에 지우기 버튼이 표시되어야 한다.
- 사용자가 지우기 버튼을 클릭하면, 검색어가 비워지고 전체 태그 목록이 다시 표시되어야 한다.
- 사용자가 검색어 없이 태그 목록을 보면, 태그 카드는 최근 저장일이 최신인 순서로 표시되어야 한다.
- 사용자가 검색어를 입력해 여러 태그가 일치하면, 더 짧게 일치하는 태그가 먼저 보이고 같은 조건에서는 최근 저장일과 대표 태그명 순서가 적용되어야 한다.
- 저장된 태그가 하나도 없는 상태에서 사용자가 태그 목록 화면에 진입하면, 빈 상태 문구와 노트로 돌아가기 버튼이 표시되어야 한다.
- 검색 결과가 없는 상태에서 사용자는 태그 목록 영역 안에서 검색 결과 없음 문구만 볼 수 있어야 한다.
- 노트 로딩 중 사용자가 태그 모드에 진입하면, 태그 화면에서도 로딩 상태가 표시되어야 한다.
- 노트 조회 오류가 있는 상태에서 사용자가 태그 모드에 진입하면, 태그 화면에서도 오류 메시지가 표시되어야 한다.
- 오류가 있더라도 이미 불러온 노트가 있으면, 사용자는 태그 카드 목록을 계속 볼 수 있어야 한다.
- 사용자가 노트 A를 선택한 뒤 태그 모드에 들어갔다가 노트로 돌아가기를 클릭하면, 노트 A가 아직 존재하는 경우 다시 선택되어야 한다.
- 사용자가 태그 모드를 나갔다가 다시 들어오면, 이전 검색어나 상세 화면이 복원되지 않고 태그 목록 초기 상태가 표시되어야 한다.

## 테스트 시나리오

- [x] [정상] collectTagSummaries — should aggregate valid saved tags with note count and latest updated date when notes contain tags
- [x] [경계] collectTagSummaries — should count duplicate comparison keys once when the same note contains duplicate persisted tags
- [x] [경계] collectTagSummaries — should exclude invalid persisted tags when notes contain invalid tag values
- [x] [정상] collectTagSummaries — should choose the most frequently used display name when comparison keys share multiple notations
- [x] [경계] collectTagSummaries — should choose the most recently used display name when notation usage counts are tied
- [x] [정상] sortTagSummariesForList — should order tag cards by latest updated date when query is empty
- [x] [정상] searchTagSummaries — should return prefix matches without case sensitivity when a user types a query
- [x] [정상] sortTagSummariesForSearch — should order searched tag cards by shorter matched name, latest updated date, and display name when multiple tags match
- [x] [정상] Layout.render — should show the tag button to the left of the new note button when the app header renders
- [x] [정상] App.openTags — should show the tag list screen without changing the browser URL when the user clicks the tag button
- [x] [정상] App.openTags — should hide the sidebar note list and note editor when tag mode is active
- [x] [정상] TagListView.render — should show title, back button, search input, and tag card grid when tag mode opens
- [x] [정상] TagListView.render — should show tag cards with display name, note count, and latest updated date when saved tags exist
- [x] [정상] TagListView.search — should show a clear button inside the search input when query has text
- [x] [정상] TagListView.search — should clear the query and restore the full tag list when the user clicks the clear button
- [x] [경계] TagListView.render — should show an empty state with a back button when there are no saved valid tags
- [x] [경계] TagListView.search — should show only the no-results message inside the list area when no tags match the query
- [x] [경계] TagListView.render — should show loading state when notes are loading in tag mode
- [x] [예외] TagListView.render — should show the notes error message when notes have a loading error in tag mode
- [x] [예외] TagListView.render — should keep rendering tag cards when an error exists with already loaded notes
- [x] [정상] App.backToNotes — should restore the previously selected note when the user returns from tag mode and that note still exists
- [x] [경계] App.openTags — should reset the previous search state when the user exits and re-enters tag mode
