# Design Components

이 문서는 현재 노트 앱의 주요 React 컴포넌트 구조와 상태별 UI 기준이다.

## `Layout`

- 최상위 배경은 `bg-background`다.
- 헤더는 흰색 카드 배경(`bg-card`)과 하단 border를 가진다.
- 헤더 오른쪽에는 `+ 새 노트` 주요 버튼을 둔다.
- 본문은 헤더 높이 65px을 제외한 화면 높이를 사용한다.
- 좌측 사이드바는 고정 너비 `w-72`이며, 노트가 많을 때 자체 스크롤된다.
- 우측 메인 영역은 남은 공간을 차지하고 자체 스크롤된다.

| 영역         | 클래스/값                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 최상위       | `min-h-screen bg-background`                                                                                            |
| 헤더         | `bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.06)]`        |
| 타이틀       | `text-2xl font-bold text-foreground`, `Boogaloo`                                                                        |
| 새 노트 버튼 | `bg-foreground text-card px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-75 transition-opacity cursor-pointer` |
| 본문         | `flex`, `height: calc(100vh - 65px)`                                                                                    |
| 사이드바     | `w-72 border-r border-border overflow-y-auto bg-muted/50 p-3 space-y-2 shrink-0`                                        |
| 메인         | `flex-1 overflow-y-auto p-8`                                                                                            |

## `NoteList`

- 로딩, 오류, 빈 목록, 목록 있음 상태를 분기한다.
- 목록이 있을 때 상단에 `노트 {count}개` 라벨을 표시한다.
- 각 노트는 `NoteItem` 카드로 렌더링하며 사이드바의 `space-y-2` 간격을 따른다.

| 상태      | 조건                 | UI                                                                  |
| --------- | -------------------- | ------------------------------------------------------------------- |
| 로딩      | `loading === true`   | `로딩 중...`, `text-sm text-muted-foreground text-center py-8`      |
| 오류      | `error` 값 존재      | `오류: {error}`, `text-sm text-destructive text-center py-8`        |
| 빈 목록   | `notes.length === 0` | `노트가 없습니다`, `text-sm text-muted-foreground text-center py-8` |
| 목록 있음 | `notes.length > 0`   | 목록 라벨과 `NoteItem` 카드 목록                                    |

## `NoteItem`

- 카드 전체가 클릭 가능한 선택 영역이다.
- 기본 상태는 `border-border`와 흰색 카드 배경이다.
- 선택 상태는 `border-foreground`와 더 강한 그림자를 적용한다.
- 삭제 버튼은 카드 우측 상단에 작게 배치하고, 카드 선택 클릭과 분리한다.

| 요소         | 클래스/값                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------ |
| 카드         | `bg-card rounded-2xl p-4 border cursor-pointer transition-all`                                   |
| 기본 카드    | `border-border hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]`                                        |
| 선택 카드    | `border-foreground shadow-[0_2px_12px_rgba(0,0,0,0.12)]`                                         |
| 제목/삭제 행 | `flex items-start justify-between gap-2`                                                         |
| 제목         | `font-semibold text-sm text-foreground line-clamp-1 flex-1`                                      |
| 삭제 버튼    | `text-muted-foreground hover:text-destructive text-xs shrink-0 transition-colors cursor-pointer` |
| 내용 요약    | `text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed`                              |
| 날짜         | `text-[10px] text-muted-foreground/70 mt-2`                                                      |

## `NoteEditor`

- 아무 노트도 선택하지 않고 생성 중도 아니면 중앙 빈 상태를 표시한다.
- 생성 또는 편집 상태에서는 흰색 편집 카드 하나를 표시한다.
- 카드 상단에는 `새 노트` 또는 `노트 편집` 라벨을 표시한다.
- 제목 입력은 테두리 없는 큰 글자 입력 필드다.
- 제목과 내용 사이에는 태그 입력 영역을 두고, 위아래 1px 구분선으로 제목/본문과 분리한다.
- 태그 입력 영역은 작은 무테 입력, 주요 버튼 패턴의 `추가` 버튼, 태그 칩 목록, 인라인 오류/미추가 안내 상태를 포함한다.
- 태그 자동완성 후보는 태그 입력 행 아래에 토큰 기반의 작은 목록 버튼으로 표시한다.
- 본문 입력은 `rows={14}`, `resize-none`, `leading-relaxed`로 고정된 장문 작성 영역을 제공한다.
- 하단 버튼 영역은 상단 border로 입력 영역과 분리한다.

| 요소            | 클래스/값                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 빈 상태 wrapper | `flex items-center justify-center h-full`                                                                                                      |
| 빈 상태 내부    | `text-center space-y-3`                                                                                                                        |
| 빈 상태 아이콘  | `text-5xl`                                                                                                                                     |
| 빈 상태 안내    | `text-muted-foreground text-sm`                                                                                                                |
| 편집 카드       | `bg-card rounded-3xl px-8 sm:px-12 py-8 shadow-[0_2px_12px_rgba(0,0,0,0.07)] border border-border max-w-2xl`                                   |
| 섹션 라벨       | `text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-6`                                                                   |
| 제목 입력       | `w-full text-xl font-bold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-4`                   |
| 구분선          | `h-px bg-border mb-4`                                                                                                                          |
| 태그 영역       | `mb-4 space-y-2`, 칩 목록 `flex flex-wrap gap-2`, 입력 행 `flex gap-2`                                                                         |
| 태그 칩         | `inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-semibold`                                                           |
| 태그 입력       | `flex-1 text-sm text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50`                                  |
| 태그 자동완성   | 후보 목록 `space-y-1`, 후보 버튼 `w-full rounded-xl border px-3 py-2 text-left text-sm`, 활성 후보 `border-foreground bg-muted`                |
| 내용 입력       | `w-full text-base text-foreground/70 bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50 leading-relaxed` |
| 버튼 영역       | `flex gap-3 mt-6 pt-4 border-t border-border`                                                                                                  |
