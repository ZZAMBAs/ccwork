# Notes App Design Guide

이 문서는 현재 `src` 안의 React 컴포넌트와 `src/index.css`에서 추출한 프론트엔드 디자인 시스템이다. 모든 스타일/UI 작업은 이 문서를 먼저 참고하고, 새 페이지와 컴포넌트는 아래 기준을 우선 적용한다. 상세 수치와 이벤트 정의는 연결된 세부 문서를 참고한다.

## 상세 문서

| 문서                                 | 내용                                                             |
| ------------------------------------ | ---------------------------------------------------------------- |
| [tokens.md](./tokens.md)             | Tailwind 기반, 폰트, 색상, radius, 그림자, 타이포그래피, 간격    |
| [components.md](./components.md)     | `Layout`, `NoteList`, `NoteItem`, `NoteEditor` 구조와 상태별 UI  |
| [interactions.md](./interactions.md) | 클릭, hover, 입력, 저장, 삭제, 목록 상태 변화                    |
| [patterns.md](./patterns.md)         | 버튼, 입력 필드, 접근성/포인터, Do/Don't, 새 컴포넌트 체크리스트 |

## 디자인 방향

- 전체 톤은 밝은 회색 배경 위에 흰색 카드와 짙은 전경색을 얹는 조용한 노트 편집 UI다.
- 장식 요소는 최소화하고, 선택 상태와 hover 상태는 테두리, 그림자, opacity 변화로 표현한다.
- 화면은 고정 헤더, 좌측 노트 목록 사이드바, 우측 편집 영역의 2단 구조를 기준으로 한다.
- 둥근 모서리와 낮은 농도의 그림자를 사용하되, 같은 화면 안에서 카드가 과하게 중첩되지 않게 한다.

## Do / Don't 요약

상세 기준: [patterns.md](./patterns.md)

| Do                                                                                     | Don't                                                                                        |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 색상은 `src/index.css`의 CSS 변수/theme token과 기존 Tailwind utility 패턴만 사용한다. | 임의 색상, 임의 그림자, 임의 radius를 컴포넌트에 흩뿌리지 않는다.                            |
| 선택, hover, disabled 상태는 이 문서의 테두리/그림자/opacity/색상 규칙을 따른다.       | 기존 조용한 노트 앱 톤과 맞지 않는 강한 장식, 과한 카드 중첩, 새 hover 패턴을 만들지 않는다. |
| 새 스타일 토큰이나 상호작용을 추가하면 관련 상세 문서를 함께 갱신한다.                 | 스타일 작업 범위를 넘어 문구, 인코딩, 데이터 동작을 같이 고치지 않는다.                      |

## 핵심 토큰

상세 기준: [tokens.md](./tokens.md)

| 토큰                       | 값                 | 현재 용도                                |
| -------------------------- | ------------------ | ---------------------------------------- |
| `--color-background`       | `hsl(0 0% 94%)`    | 앱 전체 배경                             |
| `--color-card`             | `hsl(0 0% 100%)`   | 헤더, 노트 카드, 편집 카드               |
| `--color-foreground`       | `hsl(220 35% 14%)` | 주요 텍스트, 주요 버튼 배경, 선택 테두리 |
| `--color-muted`            | `hsl(0 0% 90%)`    | 사이드바 배경 tint, 보조 버튼 배경       |
| `--color-muted-foreground` | `hsl(0 0% 42%)`    | 보조 텍스트, 메타 텍스트, 안내           |
| `--color-border`           | `hsl(0 0% 88%)`    | 헤더/사이드바/카드/구분선 테두리         |
| `--color-destructive`      | `hsl(0 84% 60%)`   | 오류 텍스트, 삭제 hover 텍스트           |

기본 UI 폰트는 `Pretendard Variable`, 앱 타이틀 폰트는 `Boogaloo`다. Tailwind CSS v4의 `@theme` 토큰을 사용하므로 색상은 `bg-background`, `text-foreground`처럼 토큰 기반 클래스로 적용한다.

## 레이아웃 요약

상세 기준: [components.md](./components.md)

- 최상위는 `min-h-screen bg-background`를 사용한다.
- 헤더는 `bg-card border-b border-border px-6 py-4`와 낮은 그림자를 사용한다.
- 본문 높이는 `calc(100vh - 65px)`이며 좌측 사이드바와 우측 메인 영역을 `flex`로 배치한다.
- 사이드바는 `w-72`, `bg-muted/50`, `p-3`, `space-y-2`, 자체 스크롤을 사용한다.
- 메인 영역은 `flex-1 overflow-y-auto p-8`을 사용한다.
- 편집 카드는 `bg-card rounded-3xl max-w-2xl`과 `px-8 sm:px-12 py-8`을 기준으로 한다.

## 컴포넌트 요약

상세 기준: [components.md](./components.md)

| 컴포넌트     | 역할                               | 주요 스타일                                                |
| ------------ | ---------------------------------- | ---------------------------------------------------------- |
| `Layout`     | 헤더, 사이드바, 메인 영역 조합     | 고정 헤더, 2단 본문, 카드형 헤더                           |
| `NoteList`   | 로딩/오류/빈 목록/목록 상태 렌더링 | 상태 메시지 `text-sm`, 목록 라벨 `text-xs tracking-widest` |
| `NoteItem`   | 노트 요약, 선택, 삭제              | `bg-card rounded-2xl p-4 border cursor-pointer`            |
| `NoteEditor` | 빈 상태, 생성/수정 폼, 저장 흐름   | 편집 카드, 무테 input/textarea, 하단 버튼 영역             |

## 상호작용 요약

상세 기준: [interactions.md](./interactions.md)

- `+ 새 노트` 클릭 시 선택 노트를 비우고 생성 상태로 진입한다.
- 노트 카드 클릭 시 해당 노트가 선택되고 편집 폼이 선택 노트 값으로 동기화된다.
- 비선택 노트 카드 hover는 낮은 그림자를 표시한다.
- 선택 노트 카드는 `border-foreground`와 더 강한 그림자를 사용한다.
- 삭제 버튼 클릭은 `stopPropagation()`으로 카드 선택 이벤트와 분리한다.
- 제목과 본문 입력은 `onChange`로 로컬 폼 상태에 즉시 반영한다.
- 저장 중에는 저장 버튼을 `disabled` 처리하고 opacity를 40%로 낮춘다.
- 오류/검증 실패는 현재 화면 메시지 대신 `console.error`로 기록한다.

## 버튼과 입력 요약

상세 기준: [patterns.md](./patterns.md)

| 패턴             | 기준                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| 주요 버튼        | `bg-foreground text-card rounded-xl text-sm font-semibold hover:opacity-75 transition-opacity`     |
| 보조 버튼        | `text-muted-foreground bg-muted hover:bg-border transition-colors`                                 |
| 위험 텍스트 버튼 | `text-muted-foreground hover:text-destructive text-xs transition-colors`                           |
| 제목 입력        | `text-xl font-bold text-foreground bg-transparent border-none outline-none`                        |
| 본문 입력        | `text-base text-foreground/70 bg-transparent border-none outline-none resize-none leading-relaxed` |

입력 필드는 카드 안에서 투명 배경과 무테 스타일을 우선 사용한다. 현재 구현에는 별도 focus ring이나 focus border 변화가 없다.

## 새 컴포넌트 작성 원칙

상세 기준: [patterns.md](./patterns.md)

- 색상은 `src/index.css`의 theme token을 우선 사용한다.
- 색상은 반드시 CSS 변수/theme token으로만 사용하고, 컴포넌트나 CSS에 하드코딩하지 않는다.
- 주요 액션은 `bg-foreground text-card rounded-xl text-sm font-semibold` 패턴을 따른다.
- 버튼 컴포넌트는 반드시 `disabled` 상태를 props로 받아 비활성 상태를 표현할 수 있어야 한다.
- 보조 액션은 muted 배경과 muted foreground 텍스트를 사용한다.
- 목록형 항목은 흰색 카드, `border-border`, `rounded-2xl`, 낮은 그림자를 기준으로 한다.
- 선택 상태는 새 색상을 추가하기보다 `border-foreground`와 그림자로 표현한다.
- hover 피드백은 opacity, 색상, 그림자 중 하나를 사용한다.
- 긴 목록 텍스트는 `line-clamp`로 높이 흔들림을 제한한다.
- 새 interaction을 추가하면 [interactions.md](./interactions.md)도 함께 갱신한다.
