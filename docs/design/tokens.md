# Design Tokens

이 문서는 `src/index.css`, `index.html`, 현재 컴포넌트 클래스에서 추출한 디자인 토큰과 수치 기준이다.

## 스타일 기반

### Tailwind CSS

- Tailwind CSS v4를 사용한다.
- 전역 CSS 진입점은 `src/index.css`다.
- 색상, 폰트, radius는 `@theme` 토큰으로 정의되어 Tailwind 클래스에서 `bg-background`, `text-foreground`처럼 사용된다.

### 폰트

| 용도           | 폰트                                             | 정의 위치                     | 사용 방식                       |
| -------------- | ------------------------------------------------ | ----------------------------- | ------------------------------- |
| 기본 UI 텍스트 | `Pretendard Variable`, `system-ui`, `sans-serif` | `index.html`, `src/index.css` | `body`, `font-sans`             |
| 앱 타이틀      | `Boogaloo`, `sans-serif`                         | `index.html`, `src/index.css` | 헤더 `h1`의 inline `fontFamily` |

기본 본문은 `body`에 `font-family: var(--font-sans)`를 적용한다. 앱 로고성 텍스트인 `📝 Notes`만 display 폰트인 `Boogaloo`를 사용한다.

## 컬러 토큰

색상은 반드시 `src/index.css`의 CSS 변수와 Tailwind theme token으로만 사용한다. 컴포넌트, CSS, inline style에 hex, rgb, rgba, hsl 값을 직접 하드코딩하지 않는다.

| 토큰                       | 값                 | 현재 용도                                      |
| -------------------------- | ------------------ | ---------------------------------------------- |
| `--color-background`       | `hsl(0 0% 94%)`    | 앱 전체 배경                                   |
| `--color-card`             | `hsl(0 0% 100%)`   | 헤더, 노트 카드, 편집 카드, 짙은 버튼의 텍스트 |
| `--color-foreground`       | `hsl(220 35% 14%)` | 주요 텍스트, 주요 버튼 배경, 선택 테두리       |
| `--color-muted`            | `hsl(0 0% 90%)`    | 사이드바 배경 tint, 보조 버튼 배경             |
| `--color-muted-foreground` | `hsl(0 0% 42%)`    | 보조 텍스트, 메타 텍스트, 비활성 안내          |
| `--color-border`           | `hsl(0 0% 88%)`    | 헤더/사이드바/카드/구분선 테두리               |
| `--color-destructive`      | `hsl(0 84% 60%)`   | 오류 텍스트, 삭제 hover 텍스트                 |

### 투명도 사용

| 표현                  | Tailwind 클래스                        | 의미                                  |
| --------------------- | -------------------------------------- | ------------------------------------- |
| 사이드바 배경         | `bg-muted/50`                          | 전체 배경보다 살짝 구분되는 목록 영역 |
| 제목/내용 placeholder | `placeholder:text-muted-foreground/50` | 입력 전 보조 안내                     |
| 편집 textarea 본문    | `text-foreground/70`                   | 제목보다 낮은 위계의 본문             |
| 날짜 메타             | `text-muted-foreground/70`             | 목록에서 가장 낮은 위계의 정보        |
| disabled 저장 버튼    | `disabled:opacity-40`                  | 저장 중 조작 불가 상태                |
| 주요 버튼 hover       | `hover:opacity-75`                     | 클릭 가능한 주요 액션의 hover 피드백  |

## Radius와 그림자

| 용도                        | 클래스/값                              |
| --------------------------- | -------------------------------------- |
| 테마 기본 radius            | `--radius: 0.75rem`                    |
| 주요 버튼                   | `rounded-xl`                           |
| 노트 목록 카드              | `rounded-2xl`                          |
| 편집 카드                   | `rounded-3xl`                          |
| 헤더 그림자                 | `shadow-[0_1px_4px_rgba(0,0,0,0.06)]`  |
| 일반 노트 카드 hover 그림자 | `shadow-[0_2px_8px_rgba(0,0,0,0.07)]`  |
| 선택 노트 카드 그림자       | `shadow-[0_2px_12px_rgba(0,0,0,0.12)]` |
| 편집 카드 그림자            | `shadow-[0_2px_12px_rgba(0,0,0,0.07)]` |

## 타이포그래피

| 요소                | 클래스                                                                  | 역할                         |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| 헤더 타이틀         | `text-2xl font-bold text-foreground`                                    | 앱 이름                      |
| 헤더/저장/취소 버튼 | `text-sm font-semibold`                                                 | 명령 버튼                    |
| 섹션 라벨           | `text-xs font-semibold tracking-widest uppercase text-muted-foreground` | 목록/편집 영역 라벨          |
| 노트 제목           | `text-sm font-semibold text-foreground line-clamp-1`                    | 목록 카드 제목               |
| 노트 내용 요약      | `text-xs text-muted-foreground line-clamp-2 leading-relaxed`            | 목록 카드 본문 미리보기      |
| 날짜                | `text-[10px] text-muted-foreground/70`                                  | 목록 카드 메타 정보          |
| 편집 제목 입력      | `text-xl font-bold text-foreground`                                     | 편집 화면의 가장 강한 텍스트 |
| 편집 본문 입력      | `text-base text-foreground/70 leading-relaxed`                          | 장문 작성 영역               |
| 빈 상태 아이콘      | `text-5xl`                                                              | 빈 화면의 시각적 중심        |
| 상태 메시지         | `text-sm text-muted-foreground text-center`                             | 로딩/빈 목록/빈 선택 안내    |
| 오류 메시지         | `text-sm text-destructive text-center`                                  | API 오류 안내                |

긴 텍스트는 목록에서 잘라낸다. 제목은 `line-clamp-1`, 본문 요약은 `line-clamp-2`를 사용해 카드 높이가 크게 흔들리지 않게 한다.

## 간격과 크기

| 영역                        | 클래스/값                                                                   |
| --------------------------- | --------------------------------------------------------------------------- |
| 앱 최상위                   | `min-h-screen bg-background`                                                |
| 헤더                        | `px-6 py-4`, `flex items-center justify-between`                            |
| 본문 높이                   | `height: calc(100vh - 65px)`                                                |
| 본문 레이아웃               | `flex`                                                                      |
| 사이드바 너비               | `w-72`                                                                      |
| 사이드바                    | `border-r border-border overflow-y-auto bg-muted/50 p-3 space-y-2 shrink-0` |
| 메인 영역                   | `flex-1 overflow-y-auto p-8`                                                |
| 편집 카드                   | `max-w-2xl px-8 sm:px-12 py-8`                                              |
| 편집 카드 섹션 라벨 하단    | `mb-6`                                                                      |
| 제목 입력 하단              | `mb-4`                                                                      |
| 제목/본문 구분선            | `h-px bg-border mb-4`                                                       |
| 편집 버튼 영역              | `flex gap-3 mt-6 pt-4 border-t border-border`                               |
| 노트 카드                   | `p-4`                                                                       |
| 노트 카드 제목/삭제 버튼 행 | `flex items-start justify-between gap-2`                                    |
| 노트 내용 요약 상단         | `mt-1.5`                                                                    |
| 날짜 상단                   | `mt-2`                                                                      |
| 목록 상태 메시지            | `py-8`                                                                      |
| 목록 라벨                   | `px-1 pb-1`                                                                 |
| 빈 선택 상태                | `flex items-center justify-center h-full`, 내부 `text-center space-y-3`     |
