# Design Patterns

이 문서는 새 컴포넌트를 만들 때 재사용할 버튼, 입력, 접근성, 체크리스트 기준이다.

## 버튼 패턴

### 주요 버튼

현재 사용 위치는 `+ 새 노트`, `저장`이다.

```tsx
className =
  'bg-foreground text-card px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-75 transition-opacity cursor-pointer';
```

저장 버튼처럼 가로 여백이 더 필요한 경우 `px-5`를 사용한다. 비동기 처리 중 비활성화가 필요하면 `disabled:opacity-40`과 `disabled` 속성을 함께 적용한다.

### 보조 버튼

현재 사용 위치는 `취소`다.

```tsx
className =
  'px-5 py-2 rounded-xl text-sm font-semibold text-muted-foreground bg-muted hover:bg-border transition-colors cursor-pointer';
```

### 위험 액션 텍스트 버튼

현재 사용 위치는 노트 카드의 `삭제`다.

```tsx
className =
  'text-muted-foreground hover:text-destructive text-xs shrink-0 transition-colors cursor-pointer';
```

위험 액션은 기본 상태에서 튀지 않게 muted 색상을 사용하고, hover에서만 destructive 색상을 드러낸다.

## 입력 패턴

### 제목 입력

```tsx
className =
  'w-full text-xl font-bold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-4';
```

- 카드 내부에서 별도 input 테두리를 사용하지 않는다.
- 제목은 본문보다 강한 `text-xl font-bold`를 사용한다.
- placeholder는 muted foreground 50% 투명도로 낮춘다.

### 본문 입력

```tsx
className =
  'w-full text-base text-foreground/70 bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50 leading-relaxed';
```

- `rows={14}`로 기본 작성 높이를 확보한다.
- 사용자가 textarea 크기를 임의로 바꾸지 않도록 `resize-none`을 사용한다.
- 본문은 제목보다 낮은 위계인 `text-foreground/70`을 사용한다.

## 접근성과 포인터

- 클릭 가능한 카드와 버튼은 모두 `cursor-pointer`를 사용한다.
- 버튼 hover 변화는 `transition-opacity` 또는 `transition-colors`로 부드럽게 처리한다.
- 현재 focus 상태에 대한 별도 시각 스타일은 없다.
- 삭제 버튼은 `stopPropagation()`으로 부모 카드의 선택 이벤트와 충돌하지 않게 한다.
- 저장 버튼은 저장 중 `disabled`를 사용해 중복 저장을 막는다.

## Do

- 스타일/UI 작업 전에는 `docs/design/design.md`를 먼저 확인하고 연결된 상세 문서를 따른다.
- 색상은 `src/index.css`의 theme token을 우선 사용한다.
- 기존 Tailwind utility 패턴을 재사용하고, 새 수치를 추가하기 전에 `tokens.md`의 색상/간격/타이포그래피 기준과 비교한다.
- 카드, 선택 상태, hover, disabled, 입력 필드 스타일은 현재 노트 앱의 조용한 편집 UI 톤에 맞춘다.
- 새 상호작용을 추가하면 `interactions.md`에 트리거, 동작, 시각 변화를 함께 문서화한다.
- 새 스타일 토큰이 필요하면 사용 위치와 목적을 디자인 문서에 남긴다.

## Don't

- 임의 색상, 임의 그림자, 임의 radius를 컴포넌트에 직접 흩뿌리지 않는다.
- 기존 톤과 맞지 않는 강한 장식, 과한 색 대비, 큰 배경 효과, 불필요한 카드 중첩을 추가하지 않는다.
- input과 textarea에 갑작스러운 테두리, 배경, focus ring을 추가하지 않는다.
- hover, focus, disabled 상태를 문서에 없는 새 패턴으로 만들지 않는다.
- 스타일 작업 범위를 넘어 문구, 인코딩, API, 저장 동작을 함께 고치지 않는다.
- 새 페이지나 컴포넌트를 만들 때 이 디자인 시스템과 다른 독립적인 시각 언어를 만들지 않는다.

## Codex hook 검증

- `.codex/hooks/design-context.mjs`는 UI/style/design 관련 요청에서 `docs/design/design.md`를 먼저 참고하라는 컨텍스트를 주입한다.
- `.codex/hooks/design-stop-check.mjs`는 턴 종료 전 `.codex/hooks/check-design-system.mjs`를 실행한다.
- 자동 검증은 명백한 위반만 잡는다: 임의 색상 Tailwind 클래스, inline color style, 현재 톤과 맞지 않는 강한 장식 후보.
- 자동 검증은 정성적 미감, 정보 구조, 실제 브라우저 렌더링 품질을 판단하지 않는다.
- hook이 위반을 보고하면 기존 theme token과 문서화된 패턴으로 수정하고 검증 스크립트를 다시 실행한다.
- repo-local Codex hook은 프로젝트 `.codex` layer가 trusted 상태일 때 동작한다.

## 새 컴포넌트 작성 체크리스트

- 색상은 `src/index.css`의 theme token을 우선 사용한다.
- 주요 액션은 `bg-foreground text-card rounded-xl text-sm font-semibold` 패턴을 따른다.
- 보조 액션은 muted 배경과 muted foreground 텍스트를 사용한다.
- 목록형 항목은 흰색 카드, `border-border`, `rounded-2xl`, 낮은 그림자를 기준으로 한다.
- 선택 상태는 색상을 새로 만들기보다 `border-foreground`와 그림자로 표현한다.
- hover 피드백은 opacity, 색상, 그림자 중 하나를 사용한다.
- 입력 필드는 카드 안에서 투명 배경과 무테 스타일을 우선 사용한다.
- 긴 목록 텍스트는 `line-clamp`로 높이 흔들림을 제한한다.
- 오류 표시는 `text-destructive`, 안내/비어 있음/로딩 표시는 `text-muted-foreground`를 사용한다.
- 새 interaction을 추가하면 `interactions.md`의 이벤트와 상태 변화 표도 함께 갱신한다.
