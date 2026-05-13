---
name: feature-design
description: Notes App 프로젝트 로컬 디자인 워크플로우. 이 저장소에서 Codex가 UI, 스타일링, 레이아웃, Tailwind 클래스, React 컴포넌트 표시 방식, 프론트엔드 상호작용, 디자인 문서를 변경할 때 사용한다.
---

# Feature Design

## 개요

Notes App의 UI와 프론트엔드 표현 작업에 이 스킬을 사용한다. 모든 프롬프트에 디자인 컨텍스트를 강제로 주입하지 말고, 필요한 시점에 프로젝트 디자인 시스템을 의도적으로 적용한다.

## 작업 절차

1. UI, 스타일링, 레이아웃, 상호작용 동작을 수정하기 전에 `docs/design/design.md`를 읽는다.
2. `design.md`에서 현재 작업과 관련된 상세 문서만 추가로 읽는다.
   - 색상, 타이포그래피, 간격, radius, shadow, Tailwind 토큰 선택은 `docs/design/tokens.md`를 확인한다.
   - `Layout`, `NoteList`, `NoteItem`, `NoteEditor` 또는 유사한 컴포넌트 구조는 `docs/design/components.md`를 확인한다.
   - 클릭, hover, focus, 입력, 저장, 삭제, 로딩, 오류, 빈 상태는 `docs/design/interactions.md`를 확인한다.
   - 버튼, 입력, 카드, 접근성, Do/Don't, 신규 컴포넌트 점검은 `docs/design/patterns.md`를 확인한다.
3. 새 값을 추가하기 전에 기존 `src/index.css` 테마 토큰과 기존 Tailwind utility 패턴으로 구현한다.
4. 범위를 좁게 유지한다. 사용자가 요청하지 않은 문구, mojibake, 데이터, 동작 수정으로 UI 작업을 확장하지 않는다.
5. 수정 후 `docs/design/patterns.md`의 Do/Don't 규칙과 `docs/design/interactions.md`의 상태 및 상호작용 일관성을 확인한다.
6. 새 토큰, 시각 패턴, 컴포넌트 패턴, 상호작용 동작을 도입했다면 같은 턴에서 관련 `docs/design` 문서를 갱신한다.
7. UI/스타일 소스 변경 후에는 가장 좁고 의미 있는 검증을 실행한다. 디자인 시스템 검증은 `node .codex/hooks/check-design-system.mjs`를 우선하고, 동작이나 계약이 바뀐 경우에만 테스트나 빌드를 추가한다.

## 프로젝트 규칙

- `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border` 같은 테마 토큰 Tailwind 클래스를 사용한다.
- 디자인 문서를 함께 갱신하지 않는 한 하드코딩 색상, 임의 Tailwind 색상, 문서화되지 않은 shadow, 문서화되지 않은 gradient, 새 radius 패턴을 피한다.
- 조용한 노트 앱 톤을 유지한다. 밝은 회색 배경, 흰색 카드, 절제된 border, 낮은 shadow, 최소한의 장식을 기준으로 한다.
- 카드 중첩은 얕게 유지한다. 카드는 반복 항목, 모달, 실제로 프레임이 필요한 도구에 사용하고, 모든 페이지 섹션에 남용하지 않는다.
- 기존 이벤트 경계를 유지한다. 특히 노트 선택과 노트 삭제가 섞이지 않게 한다.
- 기능에 사용자 표시 검증이 필요한 경우에만 inline UI 오류를 사용한다. 그 외에는 기존 오류 처리 규칙을 따른다.

## 사용하지 않는 경우

백엔드 전용 변경, 디자인 문서 외 문서만 수정하는 작업, 아키텍처 다이어그램, UI와 무관한 테스트, 패키지 유지보수, 데이터 전용 리팩터링에는 이 스킬을 사용하지 않는다.
