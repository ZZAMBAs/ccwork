---
name: mermaid-architecture-doc
description: Generate or update a Korean UTF-8 Mermaid architecture HTML document for the current repository. Use when Codex needs to inspect local source code, visualize component/module dependencies, state/data flow, and API call sequences, save the result under docs/architecture/index.html, and optionally open it in a browser.
---

# Mermaid Architecture Doc

## 개요

현재 저장소의 구현을 읽고 Mermaid 기반 아키텍처 문서를 한국어 HTML로 생성하거나 갱신한다.
결과물은 기본적으로 `docs/architecture/index.html`에 저장한다.

## 작업 절차

1. 현재 구현을 먼저 확인한다.
   - `README.md`, `AGENTS.md`, `package.json` 같은 프로젝트 설명과 설정 파일을 읽는다.
   - 진입점, 주요 컴포넌트, 상태 관리 코드, API 클라이언트, 공용 타입을 확인한다.
   - `rg`로 import, hook, provider, action, API 함수, 이벤트 핸들러 참조를 찾는다.

2. 시각화할 관점을 정한다.
   - 컴포넌트 또는 모듈 의존성
   - 상태 소유권과 데이터 흐름
   - API 호출 시퀀스
   - 프로젝트 문서에 명시된 네이밍, 오류 처리, 계층 분리 규칙

3. `docs/architecture/index.html`을 작성한다.
   - `<meta charset="UTF-8" />`를 포함한다.
   - 본문, 섹션 제목, 다이어그램 라벨은 한국어로 작성한다.
   - 정적 HTML에서 Mermaid가 렌더링되도록 구성한다.
   - Mermaid CDN을 쓰는 경우, 브라우저 렌더링에 네트워크 접근이 필요하다는 점을 완료 보고에 포함한다.

4. Mermaid 다이어그램을 구성한다.
   - `flowchart TD`는 컴포넌트/모듈 의존성에 사용한다.
   - `flowchart LR`은 상태 흐름과 데이터 흐름에 사용한다.
   - `sequenceDiagram`은 API 요청 생명주기에 사용한다.
   - 노드에는 파일 경로와 책임을 함께 적는다.
   - UI, 상태, API, 외부 서버 경계를 구분해 표현한다.

5. 검증한다.
   - 파일 생성 여부를 확인한다.
   - UTF-8로 읽어 한국어가 깨지지 않는지 확인한다.
   - 핵심 섹션 제목과 `mermaid` 블록이 있는지 검색한다.
   - 가능하면 브라우저에서 열어 렌더링을 확인한다.

## 브라우저 실행

Windows에서는 다음 형식으로 생성된 HTML을 연다.

```powershell
Start-Process -FilePath "<absolute-path-to-docs/architecture/index.html>"
```

GUI 실행 권한이 필요하면 승인 요청 후 실행한다.

## 완료 보고

완료 보고에는 다음을 포함한다.

- 생성 또는 갱신한 파일 경로
- 포함한 다이어그램 목록
- 브라우저 실행 명령
- Mermaid CDN 사용 여부와 렌더링 조건
- 검증 결과
