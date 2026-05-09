# AGENTS.md

## 프로젝트 개요

Notes App은 React 19, TypeScript, Vite로 만든 단일 페이지 노트 앱이다.
데이터 저장과 조회는 JSON Server를 사용하며, 화면은 사이드바 노트 목록과 메인 편집 영역으로 구성된다.

## 아키텍처

- `src/main.tsx`: React 진입점. `StrictMode` 안에서 `App`을 렌더링.
- `src/App.tsx`: 최상위 화면 조합과 선택/생성 상태를 관리.
- `src/context/NotesContext.tsx`: 노트 목록, 로딩/오류 상태, CRUD 액션을 제공.
- `src/api/notes.ts`: JSON Server API 클라이언트. `http://localhost:3001/notes`를 사용.
- `src/components/`: 화면 컴포넌트와 노트 작업 UI.
  - `Layout.tsx`: 헤더, 사이드바, 메인 영역 레이아웃.
  - `NoteList.tsx`: 로딩/오류/빈 목록 상태와 노트 목록 렌더링을 담당.
  - `NoteItem.tsx`: 개별 노트 요약, 선택, 삭제 액션을 담당.
  - `NoteEditor.tsx`: 노트 생성/수정 폼과 저장 흐름을 담당.
- `src/types/note.ts`: 공용 `Note` 타입을 정의.
- `src/index.css`: Tailwind CSS v4 import, 테마 토큰, 전역 기본 스타일.
- `db.json`: JSON Server의 시드 및 데이터 파일.

## 실행 구조

- 프론트엔드는 Vite로 실행되며 기본 주소는 `http://localhost:5173`.
- API는 JSON Server로 실행되며 기본 주소는 `http://localhost:3001`.
- `npm run dev`는 `concurrently`로 Vite와 JSON Server를 함께 실행.
- 노트 생성/수정 시각은 `src/api/notes.ts`에서 요청 직전에 생성.
- Context 상태는 API 요청이 성공한 뒤 응답 값을 기준으로 갱신.

## 상태 관리와 API 호출 패턴

- 노트 서버 상태는 `NotesContext`가 소유.
- 컴포넌트는 `useNotes()`로 `notes`, `loading`, `error`, CRUD 액션을 가져온다.
- Context에서 노출하는 CRUD 액션 이름은 `createNote`, `updateNote`, `deleteNote`로 통일.
- API 모듈의 CRUD 함수도 `createNote`, `updateNote`, `deleteNote` 동사 네이밍을 유지.
- 컴포넌트는 `fetch`를 직접 호출하지 않고 `src/api/notes.ts` 또는 Context 액션을 통해 접근.
- API 요청 실패는 호출 지점에서 `console.error`로 기록하고, 필요한 경우 Context의 `error` 상태로 화면에 노출.

## 명령어

- `npm run dev`: Vite와 JSON Server를 함께 실행.
- `npm run build`: TypeScript 컴파일 검사를 수행한 뒤 Vite 프로덕션 빌드를 생성.
- `npm run preview`: 프로덕션 빌드를 로컬에서 미리 본다.
- `npm run server`: JSON Server만 `3001` 포트에서 실행.
- `npm run lint`: ESLint를 `--fix` 옵션으로 실행.
- `npm run format`: Prettier로 저장소 전체를 포맷.
- `npm test`: Vitest를 1회 실행.
- `npm run test:watch`: Vitest를 watch 모드로 실행.

## 린트와 포맷

- ESLint는 `eslint.config.js`의 flat config를 사용.
- TypeScript 파일은 `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh` 설정으로 검사.
- `dist`는 ESLint 검사 대상에서 제외.
- `react-refresh/only-export-components`는 warning이며 상수 export를 허용.
- Prettier 설정:
  - 세미콜론 사용
  - 작은따옴표 사용
  - 들여쓰기 2칸
  - trailing comma 사용
  - print width 100

## TypeScript 규칙

- `strict`가 켜져 있다.
- `noUnusedLocals`, `noUnusedParameters`가 켜져 있다.
- JSX 설정은 `react-jsx`.
- 모듈 해석 방식은 `bundler`.
- 사용하지 않는 변수, 파라미터, import, 죽은 코드를 남기지 않는다.
- 컴포넌트/API 경계를 넘는 데이터 구조는 가능하면 `src/types`에 명시 타입으로 둔다.
- 컴포넌트는 반드시 named export만 사용.

## 테스트

- Vitest 설정은 `vite.config.ts`에 있다.
- 테스트 환경은 `jsdom`.
- `src/test-setup.ts`에서 `@testing-library/jest-dom`을 로드.
- 컴포넌트 동작 테스트는 React Testing Library를 우선 사용.
- 테스트는 변경한 동작에 가깝게, 필요한 범위만 추가.

## 코드 컨벤션

- 컴포넌트는 함수 컴포넌트와 named export를 사용.
- 상태 소유권을 명확히 유지.
  - 로컬 UI 상태는 상호작용을 소유한 컴포넌트에 둔다.
  - 노트 데이터와 CRUD 액션은 `NotesContext`에 둔다.
- 사용자 입력 검증이나 저장 실패 처리에 `alert`를 사용하지 않는다. 오류 기록은 `console.error`로 통일.
- API 호출은 `src/api` 안에 둔다.
- 공용 도메인 타입은 `src/types` 안에 둔다.
- 스타일은 기존 Tailwind utility와 `src/index.css`의 테마 토큰을 따른다.
- import 순서는 기존 스타일처럼 패키지 import를 먼저 두고, 그 뒤에 상대 경로 import를 둔다.
- 주석은 짧고 필요한 경우에만 작성. 코드가 이미 설명하는 내용을 반복하지 않는다.
- 현재 일부 사용자 표시 한국어 문자열은 mojibake 상태. 문구/인코딩 수정이 목표가 아닌 작업에서는 범위를 넓혀 고치지 않는다.

## 구현 참고

- `useNotes()`는 반드시 `NotesProvider` 하위에서만 호출.
- `NoteEditor`는 `selectedNoteId`와 `isCreating`으로 빈 상태, 생성 상태, 수정 상태를 결정.
- `NoteItem` 안의 삭제 버튼은 `stopPropagation()`을 호출해 삭제 클릭이 노트 선택으로 이어지지 않게 한다.
- API base URL은 현재 하드코딩. 변경할 때는 문자열을 여러 곳에 흩뿌리지 말고 작고 명확한 설정 경로를 선호.

## Git 워크플로우
1. 코드 커밋 전에 `githook/pre-commit.md`를 수행.
2. 통과했다면 `githook/commit-msg.md`를 수행.
3. 커밋 진행.

## 에이전트 작업 지침

- 수정 전에 관련 파일을 읽고, README 내용만으로 판단하지 않는다.
- 요청받은 동작에 필요한 범위로 변경을 제한한다.
- 사용자의 기존 변경 사항을 되돌리지 않는다.
- 코드 변경 후에는 가장 좁고 의미 있는 검증부터 실행.
- 동작이나 공용 계약을 바꾸는 경우 `npm test`, `npm run lint`, `npm run build` 중 적절한 검증을 우선.
- [중요] 이 AGENTS.md 내 규칙과 사용자 요청이 충돌할 경우, 사용자에게 확인을 받는다.
