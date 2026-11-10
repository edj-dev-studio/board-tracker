---
name: board-tracker
description: "보드트래커 로컬 웹 앱을 띄우고, 브라우저에서 들어오는 이사 명단 추출 요청을 Claude가 직접 처리한다. 외부 LLM API를 쓰지 않는다. 트리거: '보드트래커 시작', 'board tracker 실행', '보드트래커 종료'."
---

# board-tracker

브라우저(localhost)에서 회사·연도를 조회하면 서버가 DART 사업보고서에서 이사회 섹션을 잘라
`web/.runtime/queue/pending/<id>.json`으로 남긴다. **너(Claude)가 그 섹션을 읽고 이사 명단을 뽑아**
`web/.runtime/queue/done/<id>.json`에 쓴다. 서버는 그 결과를 캐시에 저장하고 화면에 보여준다.

## 시작 ("보드트래커 시작")

1. `web/.env.local`에 `DART_API_KEY=` 줄이 있는지 확인한다(값은 출력하지 않는다). 없으면 사용자에게 알리고 멈춘다.
2. `web/node_modules`가 없으면 `cd web && npm install`.
3. 지난 실행에서 남은 요청을 비운다: `rm -rf web/.runtime/queue`.
4. 서버를 `run_in_background`로 띄운다: `cd web && npm run dev`. 출력에 `Ready`가 나오면 사용자에게 `http://localhost:3000`을 알려준다.
   - 사내 프록시가 있으면 `curl`로 확인할 때 `--noproxy localhost`를 붙인다.
5. Monitor로 큐 감시를 켠다: command `bash web/scripts/watch-queue.sh`, `timeout_ms: 1800000`, description `보드트래커 요청 대기`.

## 요청 처리 (`REQUEST <id> <회사명> <연도>` 알림마다)

1. `web/.runtime/queue/pending/<id>.json`을 읽는다. 파일이 이미 없으면(서버가 시간 초과로 정리함) 건너뛴다.
2. `sectionText`에서 **그 연도 이사회의 모든 구성원**을 뽑는다.
   - 사내이사, 사외이사, 기타비상무이사, 대표이사 등 직위를 모두 포함한다.
   - 괄호로 나열된 이름(예: `사내이사 3인(이름1, 이름2, 이름3)`)을 빠짐없이 확인한다.
   - **섹션 텍스트에 있는 정보만 쓴다.** 추측으로 이름이나 직위를 지어내지 않는다.
   - 같은 사람이 여러 번 나오면 한 번만 쓴다. 직위는 텍스트에 적힌 표현을 따른다.
3. Write 도구로 `web/.runtime/queue/done/<id>.json`을 쓴다.
   - 성공: `{"directors": [{"name": "홍길동", "position": "사외이사"}]}`
   - 명단을 찾을 수 없음: `{"error": "<사유 한 문장>"}`
4. 터미널에 한 줄로 보고한다: `SK텔레콤 2024 — 8명` (오류면 사유).

## 감시 유지

- Monitor 만료 알림을 받으면 같은 설정으로 즉시 다시 켠다. 남은 요청은 다시 알림으로 온다.
- 감시가 꺼져 있으면 하트비트가 멈춰, 브라우저에 "Claude Code 세션에서 '보드트래커 시작'을 먼저 실행하세요."가 표시된다.

## 종료 ("보드트래커 종료")

Monitor와 dev 서버를 TaskStop으로 멈추고, 멈췄다고 알린다.
