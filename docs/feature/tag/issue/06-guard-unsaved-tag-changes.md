# Issue 6. 태그 편집 중 미저장 변경 보호하기

## 목표

사용자가 태그를 포함한 노트 편집 내용을 저장하지 않은 채 이동하려 할 때, 변경 내용을 잃지 않도록 보호한다.

## 이유

미저장 변경 보호는 태그 입력이 저장 버튼 중심 흐름에 합쳐진 뒤에 완성되는 사용자 안전장치다. 여러 화면 이동 경로에서 같은 확인 흐름을 보장해야 한다.

## 설명

기존에는 태그 입력이 추가되면서 사용자가 저장하지 않은 태그 변경을 잃을 위험이 생긴다. 이 변경 이후에는 다른 노트 선택, 새 노트 작성, 태그 모드 진입, 브라우저 이탈 전에 확인 흐름이 제공되어 사용자가 이동 여부를 직접 결정할 수 있다.

편집 화면의 마지막 저장 상태와 현재 제목, 본문, 태그 목록, 미추가 태그 입력값을 비교해 변경 여부를 판단한다. 노트 선택, 새 노트 생성, 태그 모드 진입처럼 편집 화면을 벗어나는 액션은 공통 확인 흐름을 거치게 하고, 계속 이동 시 편집 상태를 마지막 저장 상태로 되돌린 뒤 원래 액션을 실행한다. 브라우저 이탈은 `beforeunload` 기본 경고만 사용한다.

## Acceptance Criteria

- 사용자가 제목을 변경한 뒤 다른 노트를 클릭하면, 미저장 변경 확인 모달이 표시되어야 한다.
- 사용자가 본문을 변경한 뒤 새 노트 버튼을 클릭하면, 미저장 변경 확인 모달이 표시되어야 한다.
- 사용자가 태그를 추가하거나 삭제한 뒤 태그 버튼을 클릭하면, 미저장 변경 확인 모달이 표시되어야 한다.
- 사용자가 태그 입력창에 추가하지 않은 텍스트를 남긴 채 다른 노트를 클릭하면, 미저장 변경 확인 모달이 표시되어야 한다.
- 미저장 변경 확인 모달에서 사용자가 계속 이동을 선택하면, 현재 편집 내용은 마지막 저장 상태로 되돌아가고 사용자가 요청한 화면으로 이동해야 한다.
- 미저장 변경 확인 모달에서 사용자가 취소를 선택하면, 화면은 현재 노트 편집 상태에 머물고 입력한 제목, 본문, 태그가 유지되어야 한다.
- 사용자가 미저장 변경이 있는 상태에서 브라우저 새로고침이나 탭 닫기를 시도하면, 브라우저 기본 이탈 경고가 표시되어야 한다.
- 사용자가 미저장 변경 확인 후 태그 모드에 진입했다면, 태그 상세에서 노트 카드를 클릭할 때 추가 미저장 변경 모달 없이 해당 노트로 이동해야 한다.
- 사용자가 변경 사항이 없는 상태에서 다른 노트 선택, 새 노트 생성, 태그 모드 진입을 수행하면, 미저장 변경 확인 모달 없이 즉시 이동해야 한다.

## 확정 시그니처

### 공용 타입

```ts
export interface NoteEditorDraftSnapshot {
  title: string;
  content: string;
  tags: string[];
  tagInput: string;
}

export type PendingNoteNavigation =
  | { type: 'select-note'; noteId: string }
  | { type: 'new-note' }
  | { type: 'open-tags' };
```

### 순수 함수

```ts
export function hasUnsavedNoteDraftChanges(
  currentDraft: NoteEditorDraftSnapshot,
  savedDraft: NoteEditorDraftSnapshot,
): boolean;
```

- 제목, 본문, 태그 배열, 미추가 태그 입력값을 비교한다.
- 태그 배열은 현재 저장 흐름의 순서를 보존하므로 순서와 값이 모두 같을 때만 같은 상태로 본다.
- `tagInput`은 `hasPendingTagInput`과 같은 기준으로 공백만 있는 값은 미저장 변경으로 보지 않는다.
- 에러를 던지지 않고 변경 여부를 boolean으로 반환한다.

### 컴포넌트 Props

```ts
interface NoteEditorProps {
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: (savedNoteId?: string) => void;
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void;
}

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

- `NoteEditor`는 마지막 저장 상태와 현재 draft를 비교해 `onUnsavedChangesChange`로 dirty 여부를 보고한다.
- `NoteEditor`는 dirty 상태가 있을 때만 `beforeunload` 기본 경고를 등록하고, 저장 성공이나 노트 전환 후에는 dirty를 해제한다.
- `UnsavedChangesDialog`는 내부 이동 확인만 담당하며 API 호출이나 노트 상태를 직접 변경하지 않는다.

### App 상태와 핸들러

```ts
const [hasUnsavedEditorChanges, setHasUnsavedEditorChanges] = useState(false);
const [pendingNavigation, setPendingNavigation] = useState<PendingNoteNavigation | null>(null);

function requestNavigation(action: PendingNoteNavigation): void;
function confirmPendingNavigation(): void;
function cancelPendingNavigation(): void;
function executeNavigation(action: PendingNoteNavigation): void;
```

- `requestNavigation`은 dirty 상태가 없으면 즉시 `executeNavigation`을 호출한다.
- dirty 상태가 있으면 원래 액션을 `pendingNavigation`에 저장하고 미저장 변경 확인 모달을 표시한다.
- `confirmPendingNavigation`은 현재 editor draft를 계속 사용하지 않도록 pending 상태와 dirty 상태를 정리한 뒤 원래 액션을 실행한다.
- `cancelPendingNavigation`은 pending 상태만 비우고 현재 노트 편집 화면과 입력값을 유지한다.
- 태그 모드 안의 노트 카드 선택은 이미 편집 화면을 벗어난 뒤의 액션이므로 추가 guard를 거치지 않는다.

## 테스트 시나리오

- [정상] App.guardUnsavedNavigation — should show the unsaved changes dialog when the user changes title, content, saved tags, or pending tag input before selecting another note, creating a note, or opening tags
- [정상] App.confirmUnsavedNavigation — should discard the current draft and execute the queued navigation when the user chooses to continue, including entering tag mode and then selecting a tagged note without an additional dialog
- [경계] App.cancelUnsavedNavigation — should keep the current editor selected and preserve entered title, content, and tags when the user cancels the unsaved changes dialog
- [예외] App.beforeUnloadGuard — should register the browser beforeunload warning only while unsaved editor changes exist and should navigate immediately without a dialog when there are no unsaved changes
