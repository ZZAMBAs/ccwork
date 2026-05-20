---
name: github-issue-creator
description: Notes App 프로젝트 로컬 GitHub Issues 등록 워크플로우. 사용자가 특정 작업이나 기능을 GitHub Issue로 등록해 달라고 요청하거나, docs/feature/{name}/issues.md, docs/features/{name}/issues.md, issue/*.md 같은 기존 이슈 문서를 GitHub Issues로 저장해야 할 때 사용한다. PRD 작성이나 수직 슬라이스 이슈 분해는 수행하지 않는다. 명시적으로 $github-issue-creator만 호출되고 대상 이슈나 기능 설명이 없으면 "이슈를 생성할 기능을 명시해 주세요"라고 응답한다.
---

# GitHub Issue Creator

## 개요

작업 설명이나 기존 이슈 문서를 GitHub Issues로 등록한다. PRD 작성, 요구사항 인터뷰, 수직 슬라이스 이슈 분해는 이 스킬의 책임이 아니다.

## 대상 확인

명시적으로 `$github-issue-creator`만 호출됐고 대상 이슈, 작업 설명, 기능명, 기능 경로, `issues.md` 경로가 없으면 아래 문장만 응답하고 종료한다.

```text
이슈를 생성할 기능을 명시해 주세요
```

요청을 다음 중 하나로 분류한다.

1. 단일 이슈 등록: 사용자가 특정 작업이나 문제를 설명하고 GitHub Issue 등록을 요청한 경우.
2. 문서 기반 일괄 등록: `issues.md` 또는 `issue/*.md` 문서를 GitHub Issues로 등록하라고 요청한 경우.

`prd.md`가 없어도 단일 이슈 등록은 진행한다. `prd.md`를 찾아 새 이슈를 분해하지 않는다.

## 단일 이슈 등록

사용자가 이슈 내용을 직접 설명했다면 문서 산출물을 만들지 말고 GitHub Issue 등록을 준비한다.

1. `git remote -v` 또는 사용자 입력으로 대상 owner/repository를 확인한다.
2. 제목은 `[category-N] {header}: {title}` 형식으로 만든다.
   - `category`와 `N`은 사용자가 명시해야 한다.
   - 둘 중 하나라도 없으면 추정하지 말고 전체적 분류와 이슈 번호를 물어본 뒤 등록을 중단한다.
   - 예: 전체적 분류가 `tag`, 이슈 번호가 `1`이면 `[tag-1] feat: 노트에 태그를 추가, 검증, 저장하기`.
   - 사용자가 header를 명시하면 그대로 사용한다.
   - 명시가 없으면 기능 추가는 `feat`, 버그는 `fix`, 문서는 `docs`, 리팩터링은 `refactor`, 테스트는 `test`, 설정/도구는 `chore`를 선택한다.
3. 본문은 다음 구조를 사용한다.
   - `## 목표`
   - `## 목적`
   - `## 구현 참고`
   - `## Acceptance Criteria`
4. Acceptance Criteria가 없으면 요청 내용에서 검증 가능한 기준을 최소 1개 이상 도출한다. 도출할 수 없을 정도로 정보가 부족하면 한 번에 하나씩 질문한다.
5. 사용자가 assignee, label, milestone, project board를 요청하면 실제 존재 여부를 확인하고 가능한 값만 적용한다.

## 문서 기반 일괄 등록

사용자가 `issues.md`나 기능 폴더를 지정하면 기존 문서를 기준으로 등록한다.

1. 명시 경로를 우선 사용한다.
2. 기능명만 있으면 `docs/feature/{name}`를 먼저 찾고, 없으면 `docs/features/{name}`를 찾는다.
3. 기능 폴더의 `issues.md`를 읽고 링크 순서를 유지한다.
4. 링크가 `issue/*.md` 상세 문서를 가리키면 각 상세 문서를 읽는다.
5. 상세 문서의 섹션은 다음처럼 GitHub 본문에 매핑한다.
   - `목표` -> `## 목표`
   - `이유` -> `## 목적`
   - `설명` -> `## 구현 참고`
   - `Acceptance Criteria` -> `## Acceptance Criteria`
6. AC는 GitHub 체크리스트로 변환한다. 이미 체크리스트면 유지하고, 일반 목록이면 `- [ ]`로 바꾼다.
7. 제목은 `[category-N] {header}: {title}` 형식으로 만든다. 별도 요청이 없으면 기능 추가 이슈는 `feat`를 사용한다.
   - `category`는 `docs/feature/{name}` 또는 `docs/features/{name}`의 `{name}`을 사용한다.
   - `N`은 상세 이슈 문서 파일명의 선행 번호를 사용하고 앞자리 `0`은 제거한다. 예: `issue/01-add-validate-save-note-tags.md` -> `1`.
   - `issues.md` 링크 순서가 아니라 상세 문서 파일명 번호를 우선한다.
   - 상세 문서 번호를 찾을 수 없으면 등록 전 개발자에게 확인한다.
   - 예: `docs/feature/tag/issue/01-add-validate-save-note-tags.md`는 `[tag-1] feat: 노트에 태그를 추가, 검증, 저장하기` 형식으로 등록한다.

## GitHub 등록 규칙

등록 전 확인한다.

- 대상 owner/repository.
- 인증 상태. `gh`가 없으면 GitHub MCP 도구 사용 가능 여부.
- 요청된 라벨, assignee, milestone, project board의 실제 사용 가능 여부.

등록 시 지킨다.

- 라벨은 존재하는 라벨만 적용한다. 없는 라벨을 임의 생성하지 않는다.
- assignee의 "나" 또는 "자신"은 인증된 GitHub 사용자로 해석한다.
- 프로젝트 보드 등록은 사용자가 project owner와 project number를 제공하거나 확인한 뒤에만 수행한다.
- 일부 등록이 실패하면 성공/실패를 분리해 보고하고, 실패 이유와 재시도 조건을 명확히 적는다.

완료 후 이슈 번호와 URL을 요약한다.
