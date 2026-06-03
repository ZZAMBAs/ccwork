---
name: e2e-write
description: docs/features/{feature}/prd.md 또는 docs/feature/{feature}/prd.md의 사용자 스토리를 읽어 Playwright 기반 E2E 테스트 시나리오와 테스트 코드로 변환할 때 사용한다. /e2e-write {기능명}, $e2e-write {기능명}, PRD 기반 E2E 테스트 작성, Playwright E2E 시나리오 구현 요청에 사용하며, 단위 테스트가 담당하는 순수 함수/컴포넌트 세부 검증은 중복하지 않는다.
---

# E2E Write

## 목적

PRD의 사용자 스토리를 실제 브라우저 사용자 흐름 중심의 Playwright E2E 테스트로 작성한다. E2E는 화면, 서버, 상태 저장, 주요 통합 경계를 검증하고, Vitest/RTL 단위 테스트가 이미 담당하는 내부 로직 검증은 제외한다.

## 입력과 근거

사용자가 기능명을 제공하면 다음 순서로 PRD를 찾는다.

1. `docs/features/{feature}/prd.md`
2. `docs/feature/{feature}/prd.md`

기능명이 없으면 추정하지 말고 기능명을 요청한다.

작업 전에 반드시 확인한다.

- `playwright.config.ts`, `package.json`, `.gitignore`
- 관련 PRD의 사용자 스토리, acceptance criteria, out of scope
- 구현 범위와 완료된 이슈 문서. 미완성 이슈의 동작은 테스트하지 않는다.
- 기존 Vitest/RTL 테스트: `src/**/*.test.ts`, `src/**/*.test.tsx`
- 관련 UI 컴포넌트의 접근 가능한 이름, role, label, placeholder
- `AGENTS.md` 또는 `CLAUDE.md`의 테스트/코딩 컨벤션

현재 Notes App 기준 기본값:

- E2E 테스트 위치: `e2e/`
- 실행 명령: `npm run test:e2e`
- 프론트엔드: `http://localhost:5173`
- API: JSON Server `http://localhost:3001`
- 기본값은 테스트 전용 fixture와 임시 DB를 사용한다. 단, 기존 `db.json`을 직접 사용해야 하는 명확한 이유가 있으면 백업/복원/서버 상태 롤백을 구현한 경우에만 허용한다.

## 시나리오 선정 원칙

PRD의 모든 문장을 E2E로 옮기지 않는다. 다음 기준에 맞는 1-3개의 핵심 흐름만 고른다.

- 사용자가 여러 UI 영역을 거쳐 완성하는 핵심 업무 흐름
- 저장, 화면 전환, 서버 반영, 재조회처럼 통합 경계가 포함된 흐름
- 단위 테스트만으로는 놓치기 쉬운 연결 동작
- 접근 가능한 이름과 실제 사용자 조작으로 표현 가능한 흐름

E2E에서 제외한다.

- 정규화, validation 세부 조합, 정렬 함수, 집계 함수 같은 순수 로직
- 개별 컴포넌트 prop 조합, hover 색상, className, 내부 state 이름
- 이미 Vitest/RTL에서 충분히 검증된 단일 컴포넌트 상호작용
- PRD의 out of scope 항목
- 아직 구현되지 않았거나 완료 이슈 범위 밖인 기능

## 작성 절차

1. PRD 사용자 스토리를 읽고 사용자 여정 후보를 나열한다.
2. 기존 단위 테스트를 검색해 중복 검증을 제거한다.
3. 완료된 구현 범위만 기준으로 1-3개의 E2E 시나리오를 확정한다.
4. 필요한 경우 E2E 인프라를 보강한다.
   - `playwright.config.ts`에 `reporter: 'html'`을 설정해 `npm run test:e2e`만으로 HTML 리포트가 생성되게 한다.
   - Vite와 JSON Server를 자동 실행할 수 있도록 `globalSetup`/`globalTeardown` 또는 동등한 구성을 둔다.
   - 기본적으로 테스트 전용 fixture를 `e2e/fixtures/`에 두고 실행 중에는 `e2e/.tmp/`의 임시 DB를 사용한다.
   - `e2e/.tmp/`, `playwright-report/`, `test-results/` 같은 실행 산출물은 `.gitignore`에 둔다.
5. `e2e/{feature}.spec.ts`에 테스트를 작성한다.
6. `npm run test:e2e`로 HTML 리포트 생성까지 포함해 검증한다.
7. 설정/공용 계약이 바뀌면 `npm test`, `npm run build`, `npx eslint .` 중 필요한 검증을 추가 실행한다.

## 한국어 리포트 규칙

HTML 리포트에서 사람이 읽는 정보는 한국어로 작성한다.

- `test.describe()` 제목은 기능명을 한국어로 쓴다.
- `test()` 제목은 사용자 관점의 기대 결과를 한국어로 쓴다.
- 주요 사용자 행동과 검증은 `test.step()`으로 감싸고 단계명을 한국어로 쓴다.
- 리포트에 노출되는 fixture의 노트 제목, 본문, 테스트 데이터 이름도 가능하면 한국어로 둔다.
- Playwright HTML 리포트 UI 자체의 기본 영문 라벨은 변경하지 않는다.

예시:

```ts
test.describe('태그 기능', () => {
  test('기존 노트에 직접 입력한 태그를 저장하면 서버에 반영된다', async ({ page }) => {
    await test.step('태그를 편집할 기존 노트를 연다', async () => {
      await page.goto('/');
    });
  });
});
```

## 격리와 롤백 규칙

테스트 간 상태 누수를 막는다. 이전 테스트의 저장 결과가 다음 테스트에 영향을 주면 실패한 E2E로 간주한다.

- 기본값은 각 spec 또는 feature별 fixture DB와 실행 중 임시 DB를 사용하는 것이다.
- 기존 `db.json`을 직접 사용해야 한다면 테스트 시작 전 원본을 백업하고, 테스트 후 원본 내용으로 반드시 복원한다.
- `db.json` 직접 사용 예외는 실패/중단 후 수동 복구 절차, 서버 프로세스 정리, Git 변경 감지 방법까지 마련된 경우에만 선택한다.
- 상태를 변경하는 테스트는 `beforeEach`에서 fixture 기준으로 서버 상태를 초기화한다.
- 상태를 변경하는 테스트는 `afterEach`에서도 fixture 기준으로 서버 상태를 반드시 롤백한다.
- 롤백은 파일 복사만으로 끝내지 말고, 서버가 실행 중이면 API `PUT`/`POST`/`DELETE` 또는 서버 재기동 등 실제 서버 상태까지 되돌린다.
- 테스트 실패, timeout, 중단 상황에서도 가능한 한 `afterEach`와 `globalTeardown`에서 원상 복구를 시도한다.
- 테스트 병렬 실행으로 같은 리소스를 동시에 변경할 수 있으면 `workers: 1` 또는 테스트별 고유 ID를 사용한다.
- `globalTeardown`에서는 실행 중 띄운 서버 프로세스와 임시 파일을 정리한다.

권장 패턴:

```ts
test.beforeEach(async ({ request }) => {
  await resetServerState(request);
});

test.afterEach(async ({ request }) => {
  await resetServerState(request);
});
```

## Playwright 작성 규칙

- `@playwright/test`의 `test`, `expect`를 사용한다.
- locator 우선순위는 `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, `getByTestId` 순서로 둔다.
- `getByTestId`는 접근 가능한 locator가 없고 테스트 안정성이 필요할 때만 사용한다.
- 임의 대기(`waitForTimeout`)를 사용하지 말고 auto-wait assertion을 사용한다.
- 한 테스트는 하나의 사용자 여정을 검증한다. 여러 독립 기능을 한 테스트에 넣지 않는다.
- UI 내부 구현보다 사용자에게 보이는 결과와 서버 반영 결과를 검증한다.
- 네트워크 mocking은 통합 목적을 해치지 않는 경우에만 제한적으로 사용한다.
- 실패 디버깅에는 Playwright trace/screenshot을 활용하고, assertion을 과도하게 줄여 원인을 숨기지 않는다.

## 현재 프로젝트 주의사항

- 컴포넌트가 `fetch`를 직접 호출하지 않는 경계를 깨지 않는다.
- API base URL을 바꿀 때는 `src/config/api.ts` 같은 작은 설정 경로를 선호한다.
- E2E 때문에 production 코드를 과하게 바꾸지 않는다.
- 스타일/UI 변경이 포함되면 `docs/design/design.md`와 연결 문서를 먼저 확인한다.
- 검증만 필요하면 `npm run lint` 대신 `npx eslint .`를 우선 사용한다. `npm run lint`는 `--fix`를 수행한다.
- 사용자 변경 상태인 `db.json`, `coverage/`, 문서 산출물을 되돌리지 않는다.

## 완료 보고

완료 응답에는 다음을 간단히 포함한다.

- 읽은 PRD 경로
- 작성한 E2E 파일과 시나리오 요약
- 단위 테스트와 중복이라 제외한 주요 항목
- 테스트 격리/롤백 방식
- 실행한 검증 명령과 결과
