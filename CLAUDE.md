# board-tracker

DART 사업보고서에서 회사·연도별 이사회 구성원을 뽑아 보여주는 도구. **Claude Code 안에서만 실행한다.**

## 구조

- `web/` — Next.js 16 로컬 웹 앱 (localhost 전용, 로그인 없음). Next.js 16은 학습 데이터와 API가 다를 수 있으니 `web/AGENTS.md`를 따른다.
  - `web/.runtime/` — 요청 큐, 하트비트, 캐시 DB(`cache.db`), 회사 목록(`companies.json`). git 제외.
  - 테스트: `cd web && npm test`
- `main.py`, `src/`, `config.py` — 예전 Python CLI (OpenRouter 사용). 웹 앱과 별개.

## 실행 방식

"보드트래커 시작"이라고 하면 `board-tracker` 스킬(`.claude/skills/board-tracker/`)을 따른다.
웹 앱은 이사 명단 추출을 외부 LLM API 대신 이 세션의 Claude에게 파일 큐로 맡긴다.
