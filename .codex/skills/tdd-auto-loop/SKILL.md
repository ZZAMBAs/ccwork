---
name: tdd-auto-loop
description: 카테고리-이슈번호 입력 하나로 TDD 7단계를 subagent 격리 실행하고 사용자 승인 없이 완료 또는 STOP까지 진행하는 자동 컨테이너 스킬이다. /tdd-auto-loop 또는 $tdd-auto-loop와 <카테고리>-<이슈번호> 형식의 $ARGUMENTS를 함께 호출할 때 사용한다. test-scenarios, tdd-red, tdd-green, ac-verifier, tdd-refactor, security-review, create-pr 순서를 따르며 단계별 최소 JSON만 수집한다.
---

# TDD Auto Loop

이슈 1개를 받아 TDD 풀 사이클을 자동 실행한다. 메인 에이전트는 오케스트레이터다. 코드 본문, 테스트 본문, diff 본문을 직접 읽지 말고 각 단계 subagent의 JSON 결과만 검증한다.

## 입력

- `$ARGUMENTS`는 반드시 `<카테고리>-<이슈번호>` 형식이어야 한다.
- 예: `tag-1`, `note-3`, `search-12`.
- 인자가 없거나 단순 숫자이면 시작하지 않고 `STOP(invalid_arguments)`를 출력한다.

## 단계 순서

`tdd-loop` 컨테이너의 7단계 순서를 따른다.

0. Preflight
1. Test Scenarios: `/test-scenarios $ARGUMENTS`
2. TDD Red: `/tdd-red $ARGUMENTS`
3. TDD Green: `/tdd-green $ARGUMENTS`
4. AC Verifier: `@ac-verifier $ARGUMENTS`
5. TDD Refactor: `/tdd-refactor $ARGUMENTS`
6. Security Review: `/security-review $ARGUMENTS`
7. Create PR: `/create-pr`

## 오케스트레이터 원칙

- 각 단계는 Task/subagent 도구로 별도 subagent를 spawn해 실행한다. 사용 가능하면 `multi_agent_v1.spawn_agent`의 `worker`를 사용한다.
- `fork_context`는 `false`를 기본으로 한다. 필요한 지시와 이전 단계 JSON만 prompt로 전달한다.
- 메인 에이전트는 코드 본문, 테스트 본문, diff 본문을 직접 읽지 않는다.
- AC Verifier subagent는 TDD Green을 수행한 subagent와 반드시 다르게 spawn한다.
- 단계 완료 시 subagent는 정해진 JSON 한 블록만 반환해야 한다.
- 메인 세션 진행 메시지는 한 줄만 출력한다.
  - 성공: `[<단계명>] OK`
  - 중단: `[<단계명>] STOP(<사유>)`
- 사용자에게 승인이나 추가 입력을 묻지 않는다.
- STOP 시 GitHub issue comment를 작성하지 않는다. 메인 로그 JSON과 사람이 읽을 수 있는 중단 해설을 사용자에게 보고한 뒤 루프를 종료한다.

## 모든 Subagent Prompt 접미사

모든 subagent 호출 prompt 끝에 아래 문구를 그대로 붙인다.

```text
AUTONOMOUS SUBAGENT MODE:
- 하위 스킬의 사용자 승인 게이트는 자체 통과한다.
- 사용자에게 묻지 마라.
- 모호하면 STOP하고 추측하지 마라.
- 출력은 지정된 JSON schema 한 블록만 허용한다.
- JSON 앞뒤에 설명, 마크다운, 코드펜스, 일반 텍스트를 붙이지 마라.
- schema에 없는 key를 추가하지 마라.
```

## 공통 JSON 규칙

- 모든 단계는 하나의 JSON object만 반환한다.
- `stage`와 `status`는 모든 단계에 포함한다.
- `status`는 `"ok"` 또는 `"stop"`만 허용한다.
- `stop_reason`은 `status="ok"`이면 `null`, `status="stop"`이면 해당 단계 STOP 조건의 snake_case 문자열이다.
- 단계 JSON은 각 단계가 필요한 정보만 가진다. 공통 반복 식별자인 `$ARGUMENTS`, GitHub issue 번호, 요약 문장은 매 단계에 넣지 않는다.
- `files_changed`는 실제 파일을 생성 또는 수정한 단계에만 넣는다. 값은 경로 문자열 배열만 허용하고 본문이나 diff를 넣지 않는다.
- 성공 schema와 STOP schema를 다르게 취급한다. STOP 응답은 `stage`, `status`, `stop_reason`만 필수이고, 실패 전에 확정된 단계별 필드만 추가할 수 있다.
- 명세된 schema를 변형하지 않는다. schema에 없는 key를 추가하거나 예시 타입을 바꾸면 schema 위반이다.

최소 공통 형태:

```json
{
  "stage": "tdd_green",
  "status": "ok",
  "stop_reason": null
}
```

## 0. Preflight

Preflight도 subagent로 실행한다. 메인 에이전트는 직접 `git status`, 브랜치, 이슈 본문, AC를 확인하지 않는다.

확인 조건:

- `$ARGUMENTS` 형식이 `<카테고리>-<이슈번호>`이다.
- GitHub Issue를 확인했고 AC가 존재한다.
- `git status --short`가 clean이다.
- 현재 base 브랜치가 `feature/<spec>` 형식이다.
- 작업 브랜치가 `issue/<slug>` 형식으로 생성 또는 전환 가능하다.
- 작업 브랜치는 `feature/<spec>`에서 분기한다.

작업:

- GitHub 이슈 번호를 확인한다.
- issue slug를 결정한다.
- 작업 브랜치 `issue/<slug>`를 생성한다. 이미 있거나 원격에 있으면 추측하지 말고 STOP한다.

Schema:

```json
{
  "stage": "preflight",
  "status": "ok",
  "stop_reason": null,
  "category": "tag",
  "issue_number": 1,
  "github_issue": 12,
  "base_branch": "feature/tag",
  "work_branch": "issue/tag-1-add-note-tag",
  "ac_present": true,
  "git_clean": true
}
```

STOP 조건:

- `invalid_arguments`
- `github_issue_not_found`
- `ac_missing`
- `git_dirty`
- `invalid_base_branch`
- `branch_conflict`
- `branch_create_failed`
- `schema_violation`

## 1. Test Scenarios

Subagent prompt에는 `/test-scenarios $ARGUMENTS` 실행 지시와 Preflight JSON을 전달한다.

Schema:

```json
{
  "stage": "test_scenarios",
  "status": "ok",
  "stop_reason": null,
  "scenarios_count": 4,
  "signatures_confirmed": true,
  "files_changed": ["docs/feature/tag/issue/01-add-note-tag.md"]
}
```

STOP 조건:

- `scenario_generation_failed`
- `signature_missing`
- `scenario_missing`
- `issue_document_not_found`
- `schema_violation`

## 2. TDD Red

Subagent prompt에는 `/tdd-red $ARGUMENTS` 실행 지시와 이전 단계 JSON을 전달한다.

Schema:

```json
{
  "stage": "tdd_red",
  "status": "ok",
  "stop_reason": null,
  "tests_added": 4,
  "red_verified": true,
  "files_changed": ["src/components/NoteEditor.test.tsx"]
}
```

STOP 조건:

- `red_test_not_created`
- `red_state_not_verified`
- `test_collection_failed_unexpectedly`
- `schema_violation`

## 3. TDD Green

Green만 재시도한다. `/tdd-green` 스킬의 같은 테스트 최대 반복 횟수는 4회이므로, auto-loop의 Green subagent 전체 재시도 횟수도 최대 4회다.

실행 규칙:

- Green subagent가 `status="stop"`이고 `stop_reason`이 `green_failed` 또는 `tests_failed`이면 새 Green subagent를 spawn해 재시도한다.
- 최대 4회 후에도 실패하면 STOP한다.
- Green 외 단계는 업무 실패로 재시도하지 않는다.

Schema:

```json
{
  "stage": "tdd_green",
  "status": "ok",
  "stop_reason": null,
  "attempt": 1,
  "max_attempts": 4,
  "tests_passed": true,
  "coverage_run": true,
  "files_changed": ["src/context/NotesContext.tsx", "docs/feature/tag/issue/01-add-note-tag.md"]
}
```

STOP 조건:

- `green_failed`
- `tests_failed`
- `coverage_failed`
- `green_attempts_exhausted`
- `schema_violation`

## 4. AC Verifier

반드시 새 subagent로 실행한다. TDD Green subagent를 재사용하지 않는다. 구현자와 검증자가 분리되어야 한다.

Schema:

```json
{
  "stage": "ac_verifier",
  "status": "ok",
  "stop_reason": null,
  "ac_passed": true,
  "gaps": []
}
```

STOP 조건:

- `ac_passed_false`
- `ac_verifier_unavailable`
- `ac_source_unavailable`
- `schema_violation`

## 5. TDD Refactor

Subagent prompt에는 `/tdd-refactor $ARGUMENTS` 실행 지시와 이전 단계 JSON을 전달한다. 하위 승인 게이트는 자체 통과하되 모호하면 STOP한다.

Schema:

```json
{
  "stage": "tdd_refactor",
  "status": "ok",
  "stop_reason": null,
  "refactors_applied": 1,
  "tests_passed": true,
  "files_changed": ["src/context/NotesContext.tsx"]
}
```

STOP 조건:

- `baseline_tests_failed`
- `refactor_failed`
- `rollback_failed`
- `tests_failed_after_refactor`
- `schema_violation`

## 6. Security Review

Subagent prompt에는 `/security-review $ARGUMENTS` 실행 지시와 이전 단계 JSON을 전달한다. 즉시 수정 필요 항목은 자체 승인으로 처리한다. High 이상 보안 위험이 남으면 STOP한다.

Schema:

```json
{
  "stage": "security_review",
  "status": "ok",
  "stop_reason": null,
  "typecheck_passed": true,
  "audit_high_or_above": 0,
  "security_high_or_above": 0
}
```

STOP 조건:

- `typecheck_failed`
- `audit_high_or_above`
- `security_high_or_above`
- `required_fix_failed`
- `schema_violation`

## 7. Create PR

Subagent prompt에는 `/create-pr` 실행 지시, Preflight JSON, Security Review JSON을 전달한다.

강제 조건:

- PR base는 Preflight의 `base_branch`인 `feature/<spec>`이다.
- PR body에 `Closes #<GitHub 이슈 번호>`를 포함한다.
- commitlint 검증을 실행한다. 실패하면 STOP한다.
- create-pr의 사용자 승인 게이트는 자체 통과한다.

Schema:

```json
{
  "stage": "create_pr",
  "status": "ok",
  "stop_reason": null,
  "commitlint_passed": true,
  "pr_url": "https://github.com/owner/repo/pull/34",
  "issue_comment_written": true
}
```

STOP 조건:

- `commitlint_failed`
- `e2e_failed`
- `commit_failed`
- `push_failed`
- `pr_create_failed`
- `missing_closes_reference`
- `issue_comment_failed`
- `schema_violation`

## Schema 위반 재시도

- Green 외 단계에서 subagent 출력이 schema를 위반하면 같은 prompt로 1회만 재시도한다.
- 재시도 결과도 schema를 위반하면 `[<단계명>] STOP(schema_violation)`을 출력하고 STOP 처리한다.
- Green 단계의 schema 위반은 Green 재시도 횟수에 포함한다.

## STOP 처리

STOP 시 메인 에이전트는 다음 순서만 수행한다.

1. `[<단계명>] STOP(<stop_reason>)` 한 줄 출력.
2. STOP JSON을 해석해 왜 멈췄는지 사용자에게 짧게 설명한다.
3. 아래 메인 로그 JSON을 본 세션에 남긴다.
4. 루프 종료.

해설 규칙:

- 해설은 STOP JSON의 `stage`, `stop_reason`, 이전 단계 성공 여부, 확인된 `github_issue`, `base_branch`, `work_branch` 같은 필드만 근거로 작성한다.
- JSON만 출력하지 않는다. 사용자가 다음 조치를 판단할 수 있도록 원인과 권장 조치를 함께 설명한다.
- 코드 본문, 테스트 본문, diff 본문을 직접 읽지 않는다.
- GitHub issue에는 STOP 코멘트를 남기지 않는다.

STOP 메인 로그:

```json
{
  "loop": "tdd_auto_loop",
  "status": "stop",
  "argument": "tag-1",
  "github_issue": 12,
  "stage": "security_review",
  "stop_reason": "audit_high_or_above",
  "completed_stages": [
    "preflight",
    "test_scenarios",
    "tdd_red",
    "tdd_green",
    "ac_verifier",
    "tdd_refactor"
  ],
  "stop_summary": "Security Review 단계에서 npm audit 결과 High 이상 취약점이 남아 자동 루프를 중단했다.",
  "next_action": "취약점 원인을 확인해 수정하거나 무시 가능하다고 판단되면 보안 검토 정책을 조정한 뒤 다시 실행한다."
}
```

STOP 보고 예시:

```json
{
  "loop": "tdd_auto_loop",
  "status": "stop",
  "argument": "tag-1",
  "github_issue": 12,
  "stage": "security_review",
  "stop_reason": "audit_high_or_above",
  "completed_stages": [
    "preflight",
    "test_scenarios",
    "tdd_red",
    "tdd_green",
    "ac_verifier",
    "tdd_refactor"
  ],
  "stop_summary": "Security Review 단계에서 npm audit 결과 High 이상 취약점이 남아 자동 루프를 중단했다.",
  "next_action": "취약점 원인을 확인해 수정하거나 무시 가능하다고 판단되면 보안 검토 정책을 조정한 뒤 다시 실행한다."
}
```

## 완료 처리

모든 단계가 성공하면 `[Create PR] OK`를 출력한 뒤 아래 JSON만 보고한다.

```json
{
  "loop": "tdd_auto_loop",
  "status": "ok",
  "argument": "tag-1",
  "github_issue": 12,
  "base_branch": "feature/tag",
  "work_branch": "issue/tag-1-add-note-tag",
  "completed_stages": [
    "preflight",
    "test_scenarios",
    "tdd_red",
    "tdd_green",
    "ac_verifier",
    "tdd_refactor",
    "security_review",
    "create_pr"
  ],
  "pr_url": "https://github.com/owner/repo/pull/34",
  "issue_comment_written": true
}
```
