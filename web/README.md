# board-tracker web

회사·연도별 이사회 구성원을 조회하는 로컬 웹 앱 (Next.js 16, localhost 전용).

이사 명단 추출은 Claude Code 세션이 파일 큐(`.runtime/queue/`)로 처리한다. 실행은 저장소 루트에서 Claude Code를 열고 "보드트래커 시작"이라고 하면 된다. 자세한 동작은 `../.claude/skills/board-tracker/SKILL.md` 참고.

- 환경 변수: `.env.local`에 `DART_API_KEY`
- 런타임 파일: `.runtime/` (큐, 하트비트, `cache.db`, `companies.json`) — git 제외
- 테스트: `npm test`
