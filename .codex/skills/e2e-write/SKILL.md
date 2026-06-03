---
name: e2e-write
description: docs/features/{feature}/prd.md 또는 docs/feature/{feature}/prd.md의 사용자 스토리를 읽어 Playwright 기반 E2E 테스트 시나리오와 테스트 코드로 변환할 때 사용한다. /e2e-write {기능명}, $e2e-write {기능명}, PRD 기반 E2E 테스트 작성, Playwright E2E 시나리오 구현 요청에 사용하며, 단위 테스트가 담당하는 순수 함수/컴포넌트 세부 검증은 중복하지 않는다.
---

# E2E Write

## 목적

PRD의 사용자 스토리를 실제 브라우저 사용자 흐름 중심의 Playwright E2E 테스트로 작성한다. 테스트는 회귀 방지 가치가 큰 핵심 여정만 다루고, Vitest/RTL 단위 테스트가 이미 담당하는 세부 로직 검증은 제외한다.

## 입력과 근거

사용자가 기능명을 제공하면 다음 순서로 PRD를 찾는다.

1. `docs/features/{feature}/prd.md`
2. `docs/feature/{feature}/prd.md`

기능명이 없으면 추정하지 말고 기능명을 요청한다.

작업 전에 반드시 확인한다.

- `playwright.config.ts`, `package.json`, `.gitignore`
- 관련 PRD의 사용자 스토리, acceptance criteria, out of scope
- 기존 Vitest/RTL 테스트: `src/**/*.test.ts`, `src/**/*.test.tsx`
- 관련 UI 컴포넌트의 접근 가능한 이름, role, label, placeholder
- `AGENTS.md` 또는 `CLAUDE.md`의 테스트/코딩 컨벤션

현재 Notes App 기준 기본값:

- Playwright 테스트 위치는 `e2e/`
- 실행 명령은 `npm run test:e2e`
- 프런트엔드는 Vite `http://localhost:5173`, API는 JSON Server `http://localhost:3001`
- 현재 `playwright.config.ts`는 Chromium, screenshot, trace 기본값만 가진 초기 골격이다.
- 첫 실제 E2E 추가 시 서버 자동 실행과 테스트 전용 fixture DB가 없으면 함께 보강한다. 사용자의 `db.json`을 직접 테스트 데이터로 사용하거나 오염시키지 않는다.

## 시나리오 선정 원칙

PRD의 모든 문장을 테스트로 옮기지 않는다. 다음 기준으로 E2E 후보를 고른다.

- 사용자가 여러 UI 영역을 거쳐 달성하는 핵심 업무 흐름
- 저장, 화면 전환, 서버 반영, 재조회처럼 통합 경계가 포함된 흐름
- 단위 테스트만으로는 깨짐을 발견하기 어려운 연결 동작
- 접근성 이름과 실제 사용자 조작으로 표현 가능한 흐름

E2E에서 제외한다.

- 태그 정규화, validation 세부 조합, 정렬 함수, 집계 함수 같은 순수 로직
- 개별 컴포넌트 prop 조합, hover 색상, className, 내부 state 이름
- 이미 Vitest/RTL에서 충분히 검증되는 단일 컴포넌트 상호작용
- PRD의 out of scope 항목

## 작성 절차

1. PRD 사용자 스토리를 읽고 사용자 여정 후보를 나열한다.
2. 기존 단위 테스트를 검색해 중복 검증을 제거한다.
3. 남은 후보를 1-3개의 E2E 시나리오로 줄인다. 기능이 작으면 1개만 작성한다.
4. 필요한 경우 E2E 인프라를 먼저 보강한다.
   - `playwright.config.ts`에 `webServer`를 추가해 Vite와 JSON Server를 자동 실행한다.
   - 테스트 전용 fixture를 `e2e/fixtures/`에 두고 실행 중 임시 DB를 사용한다.
   - `e2e/.tmp/` 같은 실행 산출물은 `.gitignore`에 추가한다.
5. `e2e/{feature}.spec.ts`에 테스트를 작성한다.
6. 가장 좁은 검증부터 실행한다.
   - 새 파일만 확인: `npm run test:e2e -- e2e/{feature}.spec.ts`
   - 전체 E2E: `npm run test:e2e`
   - 설정/공용 계약 변경 시 `npm test`와 `npm run build`도 실행한다.

## Playwright 작성 규칙

- `@playwright/test`의 `test`, `expect`를 사용한다.
- 테스트 이름은 `should [사용자 결과] when [사용자 조건]` 형식을 사용한다.
- locator는 우선순위대로 사용한다.
  - `getByRole`
  - `getByLabel`
  - `getByPlaceholder`
  - `getByText`
  - `getByTestId`는 접근 가능한 locator가 없고 테스트 안정성이 필요할 때만 사용한다.
- 임의 대기(`waitForTimeout`)를 사용하지 않는다. `expect(locator).toBeVisible()` 같은 auto-wait assertion을 사용한다.
- 한 테스트는 하나의 사용자 여정만 검증한다. 여러 독립 기능을 한 테스트에 엮지 않는다.
- UI 세부 구현이 아니라 사용자에게 보이는 결과와 서버 반영 결과를 검증한다.
- 테스트 데이터는 고유하고 ASCII 중심으로 둔다. 기존 mojibake 문구 수정은 E2E 범위가 아니면 하지 않는다.
- 네트워크 mocking은 핵심 목적이 브라우저-앱-API 통합 검증이면 피한다. 오류 흐름처럼 서버 상태를 통제해야 할 때만 제한적으로 사용한다.
- 테스트 간 상태가 새지 않게 fixture DB를 초기화하거나 API로 준비/정리한다.
- 실패 디버깅에는 Playwright trace/screenshot을 활용하고, assertion을 늘려 문제 원인을 숨기지 않는다.

## 현재 프로젝트에서 특히 주의할 점

- 컴포넌트가 `fetch`를 직접 호출하지 않는다는 경계를 깨지 않는다.
- API base URL을 바꿀 때는 `src/config/api.ts` 같은 작은 설정 경로를 선호한다.
- E2E 때문에 production 코드를 과하게 바꾸지 않는다. 필요한 접근성 개선은 실제 사용자 접근성에도 이득이 있을 때만 한다.
- 스타일/UI 변경이 포함되면 `docs/design/design.md`와 연결 문서를 먼저 확인하고, 디자인 hook 검증을 따른다.
- `npm run lint`는 `--fix`를 수행하므로 검증만 필요하면 `npx eslint .`를 우선 사용한다.
- 사용자 변경 상태의 `db.json`, `coverage/`, 문서 산출물을 되돌리지 않는다.

## 완료 보고

완료 응답에는 다음을 간단히 포함한다.

- 읽은 PRD 경로
- 작성한 E2E 파일과 시나리오 요약
- 단위 테스트와 중복이라 제외한 주요 항목
- 실행한 검증 명령과 결과
- 남은 E2E 후보나 후속 인프라 작업
