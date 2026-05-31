# Issue 2. 기존 태그를 자동완성으로 재사용하기

## 목표

사용자가 이미 저장된 태그를 자동완성 후보로 찾아 현재 노트에 빠르게 추가할 수 있게 한다.

## 이유

자동완성은 태그 입력의 별도 사용자 가치다. 저장된 노트의 태그 집계, 현재 노트의 태그 제외, 후보 정렬, 후보 선택이 하나의 재사용 흐름으로 완성되어야 한다.

## 설명

기존에는 사용자가 태그를 매번 직접 입력해야 하지만, 이 변경 이후에는 이전에 저장한 태그를 입력 중 후보로 보고 바로 재사용할 수 있다. 사용자는 마우스나 키보드로 후보를 선택해 현재 노트의 태그 칩에 추가하고, 기존 저장 버튼으로 확정한다.

저장된 `notes`에서 태그 집계 결과를 만들고, 현재 입력값과 현재 노트의 태그 목록을 기준으로 후보를 계산한다. 후보 계산은 순수 함수로 두고, `NoteEditor`의 태그 입력 영역 또는 분리된 `TagAutocomplete` 컴포넌트는 표시, 키보드 이동, 선택 이벤트만 담당한다. 후보 선택은 저장 전 로컬 태그 칩 추가로 처리하고, 최종 반영은 기존 저장 버튼 흐름을 따른다.

## 확정 시그니처

```ts
export interface TagAutocompleteCandidate {
  comparisonKey: string;
  tagName: string;
  usageCount: number;
  latestUpdatedAt: string;
}

export function collectTagAutocompleteCandidates(notes: Note[]): TagAutocompleteCandidate[];

export function getTagAutocompleteSuggestions(
  candidates: TagAutocompleteCandidate[],
  input: string,
  currentTags: string[],
  limit?: number,
): TagAutocompleteCandidate[];

interface TagAutocompleteProps {
  suggestions: TagAutocompleteCandidate[];
  activeIndex: number;
  onSelect: (tagName: string) => void;
}
```

### 동작 계약

- `collectTagAutocompleteCandidates`는 저장된 `notes`의 유효한 태그만 비교 키로 집계한다.
- 같은 비교 키의 후보 표기는 사용 빈도가 높은 표기, 최근 사용된 표기 순으로 선택한다.
- `getTagAutocompleteSuggestions`는 정규화된 입력값으로 대소문자를 구분하지 않는 prefix 검색을 수행한다.
- 현재 노트에 이미 포함된 비교 키는 후보에서 제외한다.
- 후보는 짧은 태그명, 사용 빈도 내림차순, 최근 사용 시각 내림차순으로 정렬한다.
- `limit` 기본값은 `3`이며, 입력값이 비어 있으면 빈 배열을 반환한다.
- 후보 선택은 기존 `addTagsToList`를 재사용해 저장 전 로컬 태그 칩 추가로 처리한다.
- 최대 태그 개수 위반은 기존 인라인 오류 흐름으로 처리하며 별도 예외를 던지지 않는다.
- API와 `NotesContext` 시그니처는 변경하지 않는다.

## Acceptance Criteria

- 사용자가 노트 편집 화면에서 태그를 입력하기 시작하면, 저장된 전체 노트의 태그 중 prefix가 일치하는 자동완성 후보가 표시되어야 한다.
- 사용자가 `re`를 입력하면, `React`처럼 `re`로 시작하는 후보만 대소문자 구분 없이 표시되어야 한다.
- 사용자가 이미 현재 노트에 추가된 태그와 같은 후보를 찾는 경우, 그 태그는 자동완성 후보에 표시되지 않아야 한다.
- 사용자가 자동완성 후보를 보면, 후보는 최대 3개까지만 표시되어야 한다.
- 여러 후보가 일치하면, 사용자는 더 짧게 일치하는 태그, 사용 빈도가 높은 태그, 최근 사용된 태그 순서로 후보를 보아야 한다.
- 사용자가 자동완성 후보를 클릭하면, 해당 후보가 즉시 현재 노트의 태그 칩으로 추가되어야 한다.
- 사용자가 키보드로 자동완성 후보를 선택하면, 해당 후보가 즉시 현재 노트의 태그 칩으로 추가되어야 한다.
- 자동완성으로 태그를 추가한 뒤 사용자가 저장 버튼을 클릭하면, 서버에 저장된 해당 노트 데이터의 `tags`에 선택한 태그가 포함되어야 한다.

## 테스트 시나리오

- [x] [정상] collectTagAutocompleteCandidates — should aggregate saved valid tags by comparison key when notes contain reusable tags
- [x] [경계] collectTagAutocompleteCandidates — should exclude invalid persisted tags when notes contain invalid tag values
- [x] [경계] collectTagAutocompleteCandidates — should choose the most frequently used notation and then the most recently used notation when the same comparison key has multiple notations
- [x] [경계] collectTagAutocompleteCandidates — should count duplicate comparison keys only once when the same note contains duplicate persisted tags
- [x] [정상] getTagAutocompleteSuggestions — should return prefix-matching suggestions without case sensitivity when input is `re`
- [x] [경계] getTagAutocompleteSuggestions — should exclude suggestions already attached to the current note when comparison keys match
- [x] [경계] getTagAutocompleteSuggestions — should return at most three suggestions when more than three candidates match
- [x] [경계] getTagAutocompleteSuggestions — should order suggestions by shorter tag name, higher usage count, and more recent usage when multiple candidates match
- [x] [경계] getTagAutocompleteSuggestions — should order suggestions by distinct-note usage count when one note contains duplicate persisted tags
- [x] [경계] getTagAutocompleteSuggestions — should return an empty list when normalized input is empty
- [x] [정상] NoteEditor.autocomplete — should show suggestions derived from saved notes when the user starts typing a matching prefix
- [x] [정상] NoteEditor.selectAutocompleteSuggestion — should add the clicked suggestion as a local tag chip when the user clicks an autocomplete suggestion
- [x] [정상] NoteEditor.selectAutocompleteSuggestion — should add the active suggestion as a local tag chip when the user selects an autocomplete suggestion with the keyboard
- [x] [예외] NoteEditor.selectAutocompleteSuggestion — should show the existing inline max-tag error and keep tags unchanged when selecting a suggestion would exceed five tags
- [x] [정상] NoteEditor.save — should persist a tag selected from autocomplete when the user clicks save
