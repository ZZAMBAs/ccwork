# Issue 1. 노트에 태그를 추가, 검증, 저장하기

## 확정 시그니처

### 도메인 타입

```ts
// src/types/note.ts
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// src/types/tag.ts
export type TagValidationErrorCode = 'too-short' | 'too-long' | 'invalid-characters' | 'too-many';

export interface TagValidationError {
  code: TagValidationErrorCode;
  message: string;
}

export interface TagParseResult {
  tags: string[];
  errors: TagValidationError[];
}
```

### 태그 순수 함수

```ts
// src/utils/tags.ts
export function normalizeTagName(input: string): string;

export function getTagComparisonKey(tagName: string): string;

export function getTagValidationError(tagName: string): TagValidationError | null;

export function parseTagInput(input: string): TagParseResult;

export function addTagsToList(
  currentTags: string[],
  input: string,
  maxTags?: number,
): TagParseResult;

export function removeTagFromList(currentTags: string[], tagName: string): string[];

export function hasPendingTagInput(input: string): boolean;
```

### API

```ts
// src/api/notes.ts
export async function fetchNotes(): Promise<Note[]>;

export async function createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note>;

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note>;

export async function deleteNote(id: string): Promise<void>;
```

- `fetchNotes`, `createNote`, `updateNote` 응답은 클라이언트 반환 전에 `tags`가 없으면 `[]`로 보정한다.
- `createNote` 호출자는 항상 `tags: string[]`를 전달한다.
- `updateNote`는 기존처럼 `updatedAt`을 요청 직전에 갱신한다.
- `res.ok`가 아니면 기존 패턴대로 `Error`를 throw한다.

### Context

```ts
interface NotesContextType {
  notes: Note[];
  loading: boolean;
  error: string | null;
  createNote: (title: string, content: string, tags?: string[]) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}
```

- `createNote`는 기존 호출 호환을 위해 `tags = []` 기본값을 둔다.
- 별도 태그 리소스나 태그 전용 Context 액션은 만들지 않는다.
- 상태 갱신은 기존처럼 API 성공 응답값 기준으로 한다.

### 컴포넌트 Props

```ts
// src/components/NoteEditor.tsx
interface NoteEditorProps {
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: () => void;
}

// src/components/TagInput.tsx
interface TagInputProps {
  tags: string[];
  value: string;
  error: TagValidationError | null;
  invalidPersistedTags?: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (tagName: string) => void;
}

// src/components/TagChip.tsx
interface TagChipProps {
  tagName: string;
  variant?: 'default' | 'warning';
  onRemove?: (tagName: string) => void;
}
```

### 에러 케이스와 편집 상태

- `getTagValidationError`는 정규화 후 2자 미만이면 `too-short`, 20자 초과면 `too-long`, 허용 문자 밖의 문자가 있으면 `invalid-characters`를 반환한다.
- `getTagValidationError`는 검증 오류가 없으면 `null`을 반환한다.
- `parseTagInput`은 빈 조각과 공백 조각을 오류 없이 무시한다.
- `addTagsToList`는 현재 태그와 신규 태그의 비교 키가 같으면 중복으로 보고 추가하지 않으며 오류도 반환하지 않는다.
- `addTagsToList`는 실제 신규 추가분을 반영했을 때 `maxTags`를 초과하면 아무 태그도 추가하지 않고 `too-many`를 반환한다.
- `NoteEditor`는 `title`, `content`, `tags`, `tagInput`, `tagError`, `saving`을 로컬 상태로 둔다.
- 선택 노트 변경 시 `tags`는 `selectedNote.tags ?? []`로 초기화한다.
- 생성 상태 초기화 시 `tags: []`로 둔다.
- 저장 시 `tagInput`에 미추가 텍스트가 있으면 API 요청을 보내지 않고 안내 모달 또는 상태를 띄운다.
- 저장 성공 시 `tagInput`과 `tagError`를 초기화한다.
- 저장 실패 시 기존 입력값과 dirty 상태를 유지한다.

## 목표

사용자가 노트 편집 화면에서 태그를 추가, 검증, 삭제, 저장할 수 있게 한다.

## 이유

태그 기능의 첫 번째 수직 슬라이스는 노트 하나에 태그를 붙이고 저장하는 전체 흐름이다. 입력 규칙과 저장 계약은 별도 구현 단계가 아니라 사용자가 태그를 추가하는 기능 안에서 함께 확인되어야 한다.

## 설명

기존에는 사용자가 제목과 본문만 저장할 수 있었지만, 이 변경 이후에는 같은 편집 화면에서 태그까지 함께 입력하고 저장할 수 있다. 잘못된 태그 입력은 저장 전에 바로 확인하고 수정할 수 있으며, 태그만 바꾼 경우에도 기존 저장 버튼으로 변경을 확정한다.

`Note` 타입과 API 요청/응답 보정에 `tags: string[]`를 추가한다. 태그 정규화, 비교 키, 검증, 일괄 추가 규칙은 `src/utils/tags.ts` 같은 순수 함수로 분리하고, `NoteEditor`는 이 로직을 사용해 태그 입력 영역, 칩, 오류, 저장 흐름을 조립한다. 서버 상태 갱신은 기존 `NotesContext`의 노트 CRUD 액션을 유지하며, 별도 태그 리소스는 만들지 않는다.

## Acceptance Criteria

- 사용자가 기존 노트 목록을 열면, 서버 응답에 `tags` 값이 없는 과거 노트도 클라이언트에서는 빈 태그 목록으로 처리되어 오류 없이 목록과 편집 화면에 표시되어야 한다.
- 사용자가 노트 편집 화면을 열면, 제목 입력 아래와 본문 입력 위에 태그 입력 영역이 보여야 한다.
- 사용자가 태그명을 입력하고 `Enter`를 누르거나 추가 버튼을 클릭하면, 입력한 태그가 현재 노트의 태그 칩으로 표시되어야 한다.
- 사용자가 태그 입력창에 `  React   Query  `를 입력하고 추가하면, 태그 칩에는 `React Query`가 표시되어야 한다.
- 사용자가 `React Query`가 이미 있는 노트에 `react   query`를 입력하고 추가하면, 새 칩이 추가되지 않고 기존 태그 목록이 유지되어야 한다.
- 사용자가 `#React`와 `React`를 각각 추가하면, 두 태그는 서로 다른 태그 칩으로 표시되어야 한다.
- 사용자가 한 글자 태그를 입력하고 추가하면, 태그가 추가되지 않고 최소 길이 오류가 인라인으로 표시되어야 한다.
- 사용자가 21자를 넘는 태그를 입력하고 추가하면, 태그가 추가되지 않고 최대 길이 오류가 인라인으로 표시되어야 한다.
- 사용자가 허용되지 않은 문자가 포함된 태그를 입력하고 추가하면, 태그가 추가되지 않고 허용 문자 오류가 인라인으로 표시되어야 한다.
- 사용자가 `React, TypeScript, Vite`를 입력하고 추가하면, 세 태그가 각각 칩으로 표시되어야 한다.
- 사용자가 `React,, ,TypeScript`를 입력하고 추가하면, 빈 조각은 무시되고 `React`, `TypeScript`만 칩으로 표시되어야 한다.
- 사용자가 `React, react, React  `를 한 번에 입력하고 추가하면, 중복은 하나로 합쳐져 `React` 칩 하나만 표시되어야 한다.
- 사용자가 이미 태그 4개가 있는 노트에서 새 태그 2개를 한 번에 추가하려 하면, 아무 태그도 추가되지 않고 최대 5개 오류가 표시되어야 한다.
- 사용자가 유효하지 않은 태그를 입력하고 추가하면, 태그 목록은 변하지 않고 입력창 아래에 첫 번째 오류가 표시되어야 한다.
- 저장 데이터에 유효하지 않은 태그가 있는 노트를 사용자가 열면, 해당 태그는 일반 칩과 구분되는 경고 스타일로 표시되어야 한다.
- 사용자가 태그 칩의 삭제 버튼을 클릭하면, 해당 태그 칩이 현재 노트에서 사라져야 한다.
- 사용자가 태그 칩 본문을 클릭하면, 태그 상세 화면이나 다른 화면으로 이동하지 않아야 한다.
- 사용자가 제목과 본문은 그대로 두고 태그만 추가하거나 삭제하면, 저장 버튼이 활성화되어야 한다.
- 사용자가 태그를 추가한 뒤 저장 버튼을 클릭하면, 서버에 저장된 해당 노트 데이터의 `tags`에 추가한 태그가 포함되어야 한다.
- 사용자가 태그를 삭제한 뒤 저장 버튼을 클릭하면, 서버에 저장된 해당 노트 데이터의 `tags`에서 삭제한 태그가 제거되어야 한다.
- 사용자가 태그만 변경해 저장하면, 서버에 저장된 해당 노트 데이터의 `updatedAt`이 갱신되어야 한다.
- 사용자가 태그를 추가하지 않고 새 노트를 저장하면, 서버에 생성된 노트 데이터에는 `tags: []`가 포함되어야 한다.
- 사용자가 태그 입력창에 `React`를 입력했지만 추가하지 않은 상태에서 저장을 클릭하면, 서버 저장 요청을 보내지 않고 미추가 태그 안내 모달이 표시되어야 한다.
- 미추가 태그 안내 모달이 표시된 상태에서 사용자는 입력값을 직접 추가하거나 지운 뒤 다시 저장해야 하며, 모달 안에서 입력값이 자동으로 태그가 되지 않아야 한다.
- 미추가 태그 안내 모달이 표시되어도 기존에 저장되어 있던 태그 칩은 계속 보여야 하며, 빈 태그 칩이나 빈 삭제 버튼이 나타나지 않아야 한다.
- 저장이 성공하면, 태그 입력창의 임시 입력값과 인라인 오류는 화면에서 사라져야 한다.
- 저장이 성공하면, 사용자는 선택 없음 화면으로 이동하지 않고 저장된 노트를 계속 편집 화면에서 볼 수 있어야 한다.
- 저장 요청이 실패한 상황에서 사용자가 저장을 시도하면, 사용자가 입력한 제목, 본문, 태그 칩이 그대로 유지되고 저장 버튼은 다시 저장을 시도할 수 있는 상태여야 한다.
- 사용자가 앱을 사용하는 동안 태그 전용 목록이나 태그 전용 CRUD 화면이 새로 나타나지 않아야 한다.

## 테스트 시나리오

### 정상

- [x] [정상] fetchNotes — should return notes with tags arrays when the server response already includes tags
- [x] [정상] fetchNotes — should return notes with empty tags when the server response omits tags
- [x] [정상] createNote — should send tags as an empty array when a new note is saved without tags
- [x] [정상] updateNote — should send changed tags and refresh updatedAt when only tags are changed
- [x] [정상] normalizeTagName — should trim outer whitespace and collapse inner whitespace when input contains repeated spaces
- [x] [정상] getTagComparisonKey — should return the same comparison key when tag names differ only by case and repeated spaces
- [x] [정상] getTagValidationError — should return null when the normalized tag name is valid
- [x] [정상] parseTagInput — should return separate tags when comma-separated input contains multiple valid tag names
- [x] [정상] addTagsToList — should add a normalized tag when the user submits a single valid tag
- [x] [정상] addTagsToList — should add React Query when input is surrounded by spaces and repeated inner spaces
- [x] [정상] addTagsToList — should keep #React and React as separate tags when both are added
- [x] [정상] removeTagFromList — should remove only the selected tag when a tag removal is requested
- [x] [정상] NoteEditor.render — should show the tag input area between the title and content fields when editing or creating a note
- [x] [정상] NoteEditor.addTag — should render an added tag as a chip when the user presses Enter
- [x] [정상] NoteEditor.addTag — should render an added tag as a chip when the user clicks the add button
- [x] [정상] NoteEditor.removeTag — should remove the selected tag chip from the current note draft when the user clicks its remove button
- [x] [정상] NoteEditor.save — should persist added tags through updateNote when the user saves an existing note
- [x] [정상] NoteEditor.save — should persist removed tags through updateNote when the user saves an existing note
- [x] [정상] NoteEditor.save — should clear pending tag input and inline tag errors when save succeeds
- [x] [정상] vite dev server watch — should ignore db.json changes so saving an existing note does not reload the app

### 경계

- [x] [경계] parseTagInput — should ignore empty fragments when comma-separated input contains consecutive commas and blank fragments
- [x] [경계] addTagsToList — should merge duplicates into one tag when a single input contains the same comparison key multiple times
- [x] [경계] addTagsToList — should keep the existing tag list unchanged when input matches an existing tag by comparison key
- [x] [경계] addTagsToList — should reject the whole addition when adding multiple tags would exceed the max tag count
- [x] [경계] getTagValidationError — should return too-short when normalized input is shorter than two characters
- [x] [경계] getTagValidationError — should return too-long when normalized input is longer than twenty characters
- [x] [경계] getTagValidationError — should return invalid-characters when input contains characters outside the allowed set
- [x] [경계] NoteEditor.loadNote — should initialize tags as an empty array when the selected persisted note has no tags field
- [x] [경계] NoteEditor.loadNote — should render invalid persisted tags as warning chips when an existing note contains invalid tag values
- [x] [경계] NoteEditor.dirtyState — should enable the save button when only tags are added or removed
- [x] [경계] NoteEditor.save — should send tags as an empty array when a new note is saved without adding tags
- [x] [경계] TagChip.click — should not navigate or change screens when the user clicks the tag chip body

### 예외

- [x] [예외] addTagsToList — should return the first validation error and keep current tags unchanged when any submitted tag is invalid
- [x] [예외] NoteEditor.addTag — should show the first inline validation error and keep the tag list unchanged when invalid input is submitted
- [x] [예외] NoteEditor.save — should not call createNote or updateNote and should show pending-tag guidance when tag input has unadded text
- [x] [예외] NoteEditor.pendingTagModal — should not automatically convert pending input into a tag when the pending-tag guidance is shown
- [x] [예외] NoteEditor.pendingTagModal — should keep existing tag chips visible and avoid empty tag chips when pending-tag guidance is shown
- [x] [예외] NoteEditor.save — should preserve title, content, tag chips, and retryable save state when the save request fails
- [x] [예외] NotesContext — should expose tag changes only through existing note CRUD actions when the tag feature is used

### AC 커버리지 요약

- GitHub MCP로 `ZZAMBAs/ccwork#1`을 조회했지만 해당 번호는 AC 본문이 없는 닫힌 PR이었다. `gh` CLI도 로컬에 설치되어 있지 않아, AC 대조는 이 로컬 이슈 문서의 Acceptance Criteria 기준으로 수행했다.
- 과거 노트의 `tags` 누락 보정은 `fetchNotes`, `NoteEditor.loadNote` 시나리오로 커버한다.
- 태그 입력 영역 표시, Enter/추가 버튼, 칩 표시, 삭제, 칩 본문 클릭은 `NoteEditor.render`, `NoteEditor.addTag`, `NoteEditor.removeTag`, `TagChip.click` 시나리오로 커버한다.
- 공백 정규화, 대소문자 중복, `#React` 구분, 쉼표 분리, 빈 조각 무시는 `normalizeTagName`, `getTagComparisonKey`, `parseTagInput`, `addTagsToList` 시나리오로 커버한다.
- 최소 길이, 최대 길이, 허용 문자, 최대 5개 제한, 첫 오류 표시는 `getTagValidationError`, `addTagsToList`, `NoteEditor.addTag` 시나리오로 커버한다.
- 저장 시 태그 추가/삭제 반영, 태그만 변경 시 저장 버튼 활성화, `updatedAt` 갱신, 새 노트 `tags: []`, 저장 성공 초기화는 `NoteEditor.save`, `updateNote`, `createNote` 시나리오로 커버한다.
- 미추가 태그 안내, 안내 상태에서 자동 추가 금지, 저장 실패 시 입력 유지는 `NoteEditor.save`, `NoteEditor.pendingTagModal` 시나리오로 커버한다.
- 태그 전용 목록이나 CRUD 화면을 만들지 않는 조건은 `NotesContext` 시나리오로 커버한다.
