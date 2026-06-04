---
name: tdd-loop
description: 이슈 1개를 받아 TDD 풀 사이클의 7단계를 순서대로 진행하는 컨테이너 스킬이다. 사용자가 /tdd-loop 또는 $tdd-loop와 카테고리-이슈번호 형식의 $ARGUMENTS를 함께 호출하거나, 특정 이슈를 test-scenarios, tdd-red, tdd-green, ac-verifier, tdd-refactor, security-review, create-pr 순서로 끝까지 진행해 달라고 요청할 때 사용한다. 각 단계는 기존 스킬/에이전트의 승인 게이트를 유지하고, 이 스킬은 사전 점검과 순서 보장 및 실패 시 중단만 담당한다.
---

# TDD Loop

이슈 1개를 받아 TDD 풀 사이클을 순서대로 실행한다. 컨테이너는 직접 구현, 테스트 작성, 리팩토링, 보안 수정, PR 생성을 하지 말고 기존 스킬/에이전트를 그대로 호출한다.

## 입력 규칙

- `$ARGUMENTS`는 반드시 `<카테고리>-<이슈번호>` 형식이어야 한다.
- 예: `tag-1`, `note-3`, `search-12`.
- 인자가 없거나 단순 숫자만 있으면 어떤 단계도 시작하지 말고 중단한다.
- 입력값에서 `category`와 `issueNumber`를 분리한다.
- GitHub 이슈 번호는 사전 점검에서 GitHub Issue 제목이나 로컬 이슈 문서 매핑으로 확인한다. 확인하지 못하면 중단한다.

## 컨테이너 원칙

- 각 단계 사이에는 짧은 진행 메시지만 출력한다.
- 컨테이너 자체는 "다음 단계 진행할까요?" 같은 추가 승인 게이트를 만들지 않는다.
- 기존 스킬/에이전트 내부의 사용자 승인 게이트는 그대로 유지한다.
- 내부 스킬이 사용자 승인을 기다리면 그 응답을 받은 뒤 같은 단계의 흐름을 이어간다.
- 단계가 실패하거나 필수 조건을 확인하지 못하면 어디서 멈췄는지 명확히 출력하고 즉시 중단한다.
- 사용자의 기존 변경사항을 되돌리지 않는다.
- destructive git 작업은 사용자 명시 승인 없이 실행하지 않는다.

## 0. 사전 점검

아래 항목 중 하나라도 실패하면 이후 단계를 실행하지 않는다.

1. 입력 형식을 확인한다.
   - `<카테고리>-<이슈번호>`가 아니면 중단한다.

2. GitHub Issue 본문과 AC를 확인한다.
   - 사용 가능한 GitHub MCP를 우선 사용한다.
   - MCP가 없거나 필요한 조회를 할 수 없으면 `gh issue view`를 사용한다.
   - `$ARGUMENTS`가 GitHub 이슈 번호가 아니면 로컬 이슈 문서와 GitHub 이슈 제목을 대조해 실제 GitHub 이슈 번호를 찾는다.
   - 이슈 본문과 AC를 확인하지 못하면 중단하고 어떤 조회가 실패했는지 보고한다.

3. 작업 트리가 깨끗한지 확인한다.
   - `git status --short`를 실행한다.
   - uncommitted changes가 있으면 안전 차원에서 중단한다.

4. 현재 브랜치를 확인한다.
   - `git branch --show-current`를 실행한다.
   - 현재 브랜치가 `feat/<spec>` 형식이 아니면 중단한다.
   - 이 브랜치를 PR base로 기억한다.

5. 작업 브랜치를 결정한다.
   - GitHub 이슈 제목을 기반으로 issue slug를 만든다.
   - slug 규칙: 영문/숫자는 lowercase, 공백과 구분자는 `-`, 나머지는 제거한다.
   - 제목에서 안정적인 slug를 만들 수 없으면 `<category>-<issueNumber>`를 사용한다.
   - 작업 브랜치명은 `issue/<category>-<issueNumber>-<issue-slug>`이다.
   - `feat/*`는 spec 단위 base 브랜치로만 사용하고, 개별 이슈 구현 브랜치는 `issue/*`로 분리한다.

6. 작업 브랜치 존재 여부를 확인한다.
   - `git branch --list issue/<category>-<issueNumber>-<issue-slug>`와 원격 브랜치 존재 여부를 확인한다.
   - 이미 있으면 동일 이슈 재실행으로 간주하고 사용자에게 확인한다.
   - 선택지는 덮어쓰기 또는 취소다.
   - 덮어쓰기는 명시 승인 후에만 수행한다. 로컬/원격 브랜치 재설정이 필요하면 영향 범위를 먼저 알리고 승인받는다.
   - 취소하면 중단한다.
   - 없으면 현재 `feat/<spec>`에서 `git switch -c issue/<category>-<issueNumber>-<issue-slug>`로 분기한다.

사전 점검 완료 메시지에는 다음을 포함한다.

```text
사전 점검 완료
- 이슈: <category>-<issueNumber> / GitHub #<number>
- base: feat/<spec>
- 작업 브랜치: issue/<category>-<issueNumber>-<issue-slug>
```

## 1. Test Scenarios

진행 메시지:

```text
1/7 test-scenarios 단계로 이동합니다.
```

호출:

```text
/test-scenarios $ARGUMENTS
```

- 시그니처 승인 게이트를 유지한다.
- 시나리오 승인 게이트를 유지한다.
- 승인 거부, 입력 오류, GitHub/문서 조회 실패가 있으면 `1/7 test-scenarios에서 중단`이라고 보고하고 멈춘다.

## 2. TDD Red

진행 메시지:

```text
2/7 tdd-red 단계로 이동합니다.
```

호출:

```text
/tdd-red $ARGUMENTS
```

- 승인된 시나리오를 실패 테스트로 변환한다.
- 테스트 collect 실패가 발생하면 import 대상 stub이 필요한지 안내하고, 해당 판단은 `tdd-red` 또는 다음 `tdd-green` 규칙에 따른다.
- 실패 테스트가 만들어지지 않거나 기존 스킬이 중단하면 `2/7 tdd-red에서 중단`이라고 보고하고 멈춘다.

## 3. TDD Green

진행 메시지:

```text
3/7 tdd-green 단계로 이동합니다.
```

호출:

```text
/tdd-green $ARGUMENTS
```

- 최소 구현으로 실패 테스트를 통과시킨다.
- 회귀 감시는 `tdd-green` 내부의 `npm test` 루프에 맡긴다.
- 테스트가 계속 실패하거나 blocker가 보고되면 `3/7 tdd-green에서 중단`이라고 보고하고 멈춘다.

## 4. AC Verifier

진행 메시지:

```text
4/7 ac-verifier 단계로 이동합니다.
```

호출:

```text
@ac-verifier $ARGUMENTS
```

- GitHub 이슈 본문과 AC를 근거로 독립 검증을 요청한다.
- 테스트 통과를 AC 충족으로 간주하지 않는다.
- 갭이 있으면 사용자에게 보고하고 중단한다.
- `@ac-verifier`를 사용할 수 없으면 대체 검증을 임의로 수행하지 말고 `4/7 ac-verifier에서 중단`이라고 보고한다.

## 5. TDD Refactor

진행 메시지:

```text
5/7 tdd-refactor 단계로 이동합니다.
```

호출:

```text
/tdd-refactor $ARGUMENTS
```

- 현재 이슈에서 변경된 `src` 파일만 대상으로 한다.
- 리팩토링 후보 승인 게이트를 유지한다.
- 각 변경마다 `npm test`를 실행하는 내부 규칙을 유지한다.
- baseline 실패, 승인 거부, 리팩토링 실패가 있으면 `5/7 tdd-refactor에서 중단`이라고 보고하고 멈춘다.

## 6. Security Review

진행 메시지:

```text
6/7 security-review 단계로 이동합니다.
```

호출:

```text
/security-review $ARGUMENTS
```

- `npx tsc --noEmit`, `npm audit`, 보안 패턴 점검은 내부 스킬에 맡긴다.
- 즉시 수정 필요, 권장 수정, 무시 가능 분류와 승인 게이트를 유지한다.
- 즉시 수정 필요 항목 처리 실패나 승인 거부가 있으면 `6/7 security-review에서 중단`이라고 보고하고 멈춘다.

## 7. Create PR

진행 메시지:

```text
7/7 create-pr 단계로 이동합니다.
```

호출:

```text
/create-pr
```

추가 지시를 함께 전달한다.

- PR base는 사전 점검에서 기억한 `feat/<spec>`으로 설정한다.
- PR body에 `Closes #<GitHub 이슈 번호>`를 반드시 포함한다.
- 커밋이 필요하면 commitlint 통과 가능한 한국어 기반 메시지를 제안하고, create-pr 내부 승인 게이트를 유지한다.
- PR 생성 후 GitHub 이슈에 PR 링크를 코멘트로 남긴다. GitHub MCP를 우선 사용하고, 불가능하면 `gh issue comment <number> --body "<PR URL>"`를 사용한다.

`create-pr`가 E2E 실패, push 실패, PR 생성 실패로 중단하면 `7/7 create-pr에서 중단`이라고 보고한다.

## 완료 보고

성공 시 다음만 간결하게 보고한다.

- 처리 이슈: `<category>-<issueNumber>` / `#<GitHub 이슈 번호>`
- base 브랜치와 작업 브랜치
- 완료한 단계: 1/7부터 7/7
- PR URL
- 이슈 코멘트 작성 여부

중단 시 다음 형식으로 보고한다.

```text
TDD Loop 중단
- 중단 단계: <0-7>/<단계명>
- 이유: <구체적 실패 조건>
- 다음 조치: <사용자가 이어서 할 일>
```
