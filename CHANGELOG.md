# 변경 이력

## 2026-03-24

### 캐시 시스템 도입
- LLM 분석 결과를 캐시에 저장하여, 동일한 회사/연도 조회 시 캐시된 결과를 즉시 반환하도록 개선
- Python: SQLite 기반 로컬 캐시 (src/db.py)
- Web: Neon Postgres 기반 캐시 (lib/db.ts)
- API 토큰 사용량 절감 및 응답 속도 향상

### AASSOCNOTE 기반 섹션 추출로 전환
- 기존 텍스트 키워드 매칭 방식에서 DART 표준 AASSOCNOTE 속성(`D-0-6-1-0`) 기반으로 변경
- html.parser(Python) / cheerio xml 모드(Web) 사용하여 DART 커스텀 태그 보존
- 12개 회사 전수 검증 완료

### 프로젝트 구조 정비
- requirements.txt → pyproject.toml + uv.lock 전환
- README.md, service_flow.md 추가
- Web: Next.js 16 앱 (board-tracker-web 별도 repo로 분리, Vercel 배포)

### 재무/회계 전문가 기능 추가 후 롤백
- 감사제도 섹션 분석 및 financial_expert 컬럼 추가 시도
- 최종적으로 불필요 판단하여 롤백 — 이사회 섹션만 추출하는 구조로 확정
