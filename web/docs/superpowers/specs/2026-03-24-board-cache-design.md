# Board Cache 설계 — Vercel Postgres 기반 조회 결과 캐싱

## Context

Board Tracker는 DART API에서 이사회 정보를 추출한 뒤 LLM으로 파싱하여 사용자에게 제공한다. 과거 이사회 멤버 구성은 변하지 않는데, 같은 회사+연도 조합을 조회할 때마다 DART API 호출과 LLM 토큰이 낭비된다. 한번 조회한 결과를 Vercel Postgres에 캐싱하여 불필요한 리소스 소비를 제거한다.

## 요구사항

1. 회사+연도 단위로 조회 결과를 DB에 저장
2. 재조회 시 캐시된 연도는 DB에서 로드, 미캐시 연도만 API+LLM 호출
3. Admin 페이지에서 캐시 데이터를 조회/삭제할 수 있는 UI 제공
4. 캐시 저장 시점(cached_at) 기록

## DB 스키마

Vercel Postgres (단일 JSONB 테이블):

```sql
CREATE TABLE IF NOT EXISTS board_cache (
  id SERIAL PRIMARY KEY,
  corp_name VARCHAR(100) NOT NULL,
  stock_code VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  directors JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stock_code, year)
);
```

- `directors` 컬럼: `[{"name": "홍길동", "position": "사외이사"}, ...]` 형태의 JSON 배열
- `UNIQUE(stock_code, year)`: 동일 회사+연도 중복 저장 방지. 이 제약조건이 인덱스도 겸함
- JSONB 선택 이유: 항상 회사+연도 묶음으로 읽고 쓰므로 정규화 불필요
- 예상 데이터 규모: 최대 ~200사 × ~10년 = ~2000행, 행당 ~1-2KB → 총 ~4MB 이내 (Vercel Postgres 무료 256MB 대비 충분)

## 아키텍처

### 변경되는 흐름

**현재 `/api/analyze` 흐름:**
```
요청(corpName, stockCode, year)
  → DART API (corp_code 조회)
  → DART API (보고서 검색)
  → DART API (HTML 다운로드)
  → cheerio 파싱
  → LLM 분석
  → 응답
```

**변경 후 `/api/analyze` 흐름:**
```
요청(corpName, stockCode, year)
  → DB 캐시 확인 (stock_code + year)
  → [캐시 HIT] → DB 결과 + cached_at 반환
  → [캐시 MISS] → DART API → cheerio → LLM → DB 저장 → 응답
```

### 새 파일

| 파일 | 용도 |
|------|------|
| `lib/db.ts` | Vercel Postgres 연결, 캐시 CRUD 함수 |
| `app/api/cache/route.ts` | 캐시 관리 API (GET 조회, DELETE 삭제) |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `app/api/analyze/route.ts` | 캐시 확인 → 히트 시 즉시 반환, 미스 시 기존 로직 + DB 저장 |
| `app/admin/page.tsx` | 탭 UI 추가 ("회사 관리" / "캐시 관리") |
| `app/results/page.tsx` | `AnalyzeResult` 타입에 `cached?: boolean` 추가 |
| `proxy.ts` | `/api/cache` DELETE 요청에 대한 Admin 권한 체크 추가 |
| `package.json` | `@vercel/postgres` 의존성 추가 |

## 상세 설계

### 1. `lib/db.ts` — DB 유틸리티

```typescript
// 주요 함수
ensureTable(): Promise<void>          // CREATE TABLE IF NOT EXISTS
getCachedResult(stockCode: string, year: number): Promise<CacheEntry | null>
saveCacheResult(corpName: string, stockCode: string, year: number, directors: Director[]): Promise<void>
getCacheList(): Promise<CacheEntry[]>  // Admin 전체 목록
deleteCacheEntries(ids: number[]): Promise<void>  // 선택 삭제
deleteAllCache(): Promise<void>        // 전체 삭제

// 타입
interface CacheEntry {
  id: number;
  corp_name: string;
  stock_code: string;
  year: number;
  directors: { name: string; position: string }[];
  cached_at: string;
}
```

- `ensureTable()`은 각 DB 함수 진입 시 한번만 실행 (모듈 레벨 플래그). Serverless cold start마다 실행될 수 있으나 `CREATE TABLE IF NOT EXISTS`이므로 무해하고 오버헤드 미미
- `saveCacheResult()`는 `INSERT ... ON CONFLICT (stock_code, year) DO UPDATE` (UPSERT) 사용 — 동시 요청 시 race condition 방지
- Vercel Postgres의 `@vercel/postgres` 패키지의 `sql` 템플릿 태그 사용

### 2. `/api/cache` — 캐시 관리 API

**GET `/api/cache`**
- 인증: Admin 권한 필요 (기존 `getSession()` 활용)
- 응답: `{ caches: CacheEntry[] }` — corp_name ASC, year DESC 정렬

**DELETE `/api/cache`**
- 인증: Admin 권한 필요 (`proxy.ts` 미들웨어 + 핸들러 내 `getSession()` 이중 체크)
- 요청 body: `{ action: "delete", ids: number[] }` 또는 `{ action: "deleteAll" }`
- 응답: `{ success: true, deleted: number }`

### 3. `/api/analyze` 변경

기존 POST 핸들러 시작 부분에 캐시 확인 로직 추가:

```
1. 입력 검증 (기존)
2. [NEW] getCachedResult(stockCode, year) 호출
3. [NEW] 캐시 있으면 → { corpName, year, directors, cached: true } 반환
4. 캐시 없으면 → 기존 DART+LLM 파이프라인 실행
5. [NEW] 성공 시 saveCacheResult() 호출 — 실패해도 결과는 정상 반환 (캐시 저장은 best-effort)
6. 응답 반환 (캐시 미스 시 cached 필드 없음)
```

> **부분 캐시 동작 방식**: Results 페이지는 이미 회사×연도별로 개별 `/api/analyze` 요청을 보냄. 따라서 특별한 배치 로직 없이도 캐시된 연도는 즉시 반환되고, 미캐시 연도만 API+LLM을 호출하게 됨.

### 4. Admin 페이지 UI 변경

**탭 구조:**
```
[회사 관리]  [캐시 관리]
─────────────────────────
```

**캐시 관리 탭 UI:**
```
┌─────────────────────────────────────────────────────────┐
│  [전체 삭제]  [선택 삭제 (N건)]                            │
├────┬──────────┬──────┬────────┬─────────────────────────┤
│ ☐  │ 회사명    │ 연도  │ 이사 수 │ 저장 시점               │
├────┼──────────┼──────┼────────┼─────────────────────────┤
│ ☐  │ SK텔레콤  │ 2025 │ 8명    │ 2026-03-24 14:30:00     │
│ ☑  │ SK텔레콤  │ 2024 │ 7명    │ 2026-03-20 10:15:00     │
│ ☑  │ 삼성전자  │ 2024 │ 11명   │ 2026-03-19 09:00:00     │
└────┴──────────┴──────┴────────┴─────────────────────────┘
```

**삭제 확인 팝업:**
- 선택 삭제: "선택하신 N건의 캐시 데이터를 삭제하시겠습니까? 삭제된 데이터는 다음 조회 시 DART API와 LLM을 통해 다시 수집됩니다."
- 전체 삭제: "저장된 모든 캐시 데이터를 삭제하시겠습니까? 삭제된 데이터는 다음 조회 시 DART API와 LLM을 통해 다시 수집됩니다."
- 버튼: [취소] [삭제]

## 환경 설정

Vercel 프로젝트에 Postgres 연결 필요:
- Vercel 대시보드 → Storage → Create Database → Postgres
- 자동으로 `POSTGRES_URL` 등 환경변수가 프로젝트에 연결됨
- 로컬 개발: `vercel env pull .env.local`로 환경변수 가져오기

## 검증 방법

1. **캐시 저장 확인**: 회사+연도 조회 → DB에 결과 저장 확인
2. **캐시 히트 확인**: 같은 회사+연도 재조회 → DART API/LLM 호출 없이 즉시 응답
3. **부분 캐시 확인**: SK텔레콤 2022-2025 조회 후, 2020-2023 조회 → 2020,2021만 새로 API 호출
4. **Admin 캐시 목록**: 캐시 관리 탭에서 저장된 데이터 목록 확인
5. **선택 삭제**: 체크박스 선택 → 삭제 → 확인 팝업 → 삭제 확인
6. **전체 삭제**: 전체 삭제 버튼 → 확인 팝업 → 전체 삭제 확인
7. **삭제 후 재조회**: 삭제한 회사+연도 재조회 시 API+LLM 다시 호출되는지 확인
