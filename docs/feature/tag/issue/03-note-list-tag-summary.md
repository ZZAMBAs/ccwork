# Issue 3. 사이드바 노트 목록에서 태그 요약 보기

## 확정 시그니처

대상 컴포넌트는 `NoteItem`으로 한정한다. 새 공용 타입이나 API/Context 변경은 필요 없다.

```ts
interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}
```

렌더링 계약:

- `note.tags`가 1개 이상이면 최대 2개 태그 칩을 표시한다.
- `note.tags.length > 2`이면 남은 개수를 `+N`으로 표시한다.
- `note.tags`가 비어 있으면 태그 요약 영역을 렌더링하지 않는다.
- 태그 칩은 표시 전용이며 별도 클릭 핸들러를 갖지 않는다.
- 긴 태그명은 한 줄 말줄임 처리한다.
- `NoteItem` 클릭은 기존처럼 `onSelect(note.id)`를 호출한다.
- 삭제 버튼 클릭은 기존처럼 `stopPropagation()` 후 `onDelete(note.id)`를 호출한다.

테스트 대상:

- `src/components/NoteItem.test.tsx` 신규 추가
- React Testing Library로 `NoteItem` 단독 렌더링 검증
- `NoteList`, `NotesContext`, API, `Note` 타입 변경 없음

에러 케이스:

- 별도 throw나 오류 상태 없음
- `tags: []`는 정상 빈 상태로 처리

## 목표

기존 노트 목록에서 각 노트의 주요 태그를 빠르게 확인할 수 있게 한다.

## 이유

태그가 편집 화면 안에만 보이면 목록 탐색 가치가 낮다. 사용자는 노트를 열기 전에 분류 정보를 확인할 수 있어야 한다.

## 설명

기존에는 사용자가 노트를 열기 전까지 태그 정보를 알 수 없지만, 이 변경 이후에는 사이드바 목록에서 각 노트의 주요 태그를 바로 훑어볼 수 있다. 사용자는 태그 요약을 참고해 원하는 노트를 더 빠르게 선택할 수 있다.

`NoteItem`에서 노트의 `tags`를 읽어 최대 2개만 요약 칩으로 렌더링하고, 나머지는 `+N`으로 표시한다. 선택과 삭제 이벤트 경계는 기존 `NoteItem` 동작을 유지하며, 태그 칩은 표시 전용으로 둔다. 긴 태그명은 기존 목록 레이아웃 안에서 말줄임 처리한다.

## Acceptance Criteria

- 사용자가 노트 목록을 보면, 태그가 있는 노트에는 최대 2개의 태그 칩이 함께 표시되어야 한다.
- 사용자가 태그가 3개인 노트를 목록에서 보면, 태그 칩 2개와 `+1` 표시가 보여야 한다.
- 사용자가 태그가 없는 노트를 목록에서 보면, 태그 칩 영역 때문에 기존 제목과 본문 미리보기 표시가 어색하게 깨지지 않아야 한다.
- 사용자가 노트 목록 아이템을 클릭하면, 태그 칩이 표시되어 있어도 해당 노트가 선택되어야 한다.
- 사용자가 노트 삭제 버튼을 클릭하면, 태그 칩이 표시되어 있어도 노트 선택이 함께 발생하지 않고 삭제 흐름만 실행되어야 한다.
- 사용자가 긴 태그명을 가진 노트를 목록에서 보면, 긴 태그 텍스트는 한 줄 안에서 말줄임되어 목록 레이아웃을 밀어내지 않아야 한다.

## 테스트 시나리오

- [x] [정상] NoteItem.render — should show up to two tag chips when the note has saved tags
- [x] [정상] NoteItem.render — should show a remaining tag count when the note has more than two tags
- [x] [경계] NoteItem.render — should not render a tag summary area when the note has no tags
- [x] [정상] NoteItem.select — should call onSelect for the note when the user clicks a tagged note item
- [x] [정상] NoteItem.delete — should call only onDelete when the user clicks the delete button in a tagged note item
- [x] [경계] NoteItem.render — should keep long tag text in a single truncated line when a tag name is long
