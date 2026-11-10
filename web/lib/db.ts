import { neon } from "@neondatabase/serverless";

export interface CacheEntry {
  id: number;
  corp_name: string;
  stock_code: string;
  year: number;
  directors: { name: string; position: string }[];
  cached_at: string;
}

function getSQL() {
  return neon(process.env.DATABASE_URL!);
}

let initialized = false;

async function ensureTable() {
  if (initialized) return;
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS board_cache (
      id SERIAL PRIMARY KEY,
      corp_name VARCHAR(100) NOT NULL,
      stock_code VARCHAR(20) NOT NULL,
      year INTEGER NOT NULL,
      directors JSONB NOT NULL,
      cached_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(stock_code, year)
    )
  `;
  initialized = true;
}

export async function getCachedResult(
  stockCode: string,
  year: number
): Promise<CacheEntry | null> {
  await ensureTable();
  const sql = getSQL();
  const rows = await sql`
    SELECT id, corp_name, stock_code, year, directors, cached_at
    FROM board_cache
    WHERE stock_code = ${stockCode} AND year = ${year}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id as number,
    corp_name: row.corp_name as string,
    stock_code: row.stock_code as string,
    year: row.year as number,
    directors: row.directors as { name: string; position: string }[],
    cached_at: String(row.cached_at),
  };
}

export async function saveCacheResult(
  corpName: string,
  stockCode: string,
  year: number,
  directors: { name: string; position: string }[]
): Promise<void> {
  await ensureTable();
  const sql = getSQL();
  await sql`
    INSERT INTO board_cache (corp_name, stock_code, year, directors)
    VALUES (${corpName}, ${stockCode}, ${year}, ${JSON.stringify(directors)})
    ON CONFLICT (stock_code, year)
    DO UPDATE SET
      corp_name = EXCLUDED.corp_name,
      directors = EXCLUDED.directors,
      cached_at = NOW()
  `;
}

export async function getCacheList(): Promise<CacheEntry[]> {
  await ensureTable();
  const sql = getSQL();
  const rows = await sql`
    SELECT id, corp_name, stock_code, year, directors, cached_at
    FROM board_cache
    ORDER BY corp_name ASC, year DESC
  `;
  return rows.map((row) => ({
    id: row.id as number,
    corp_name: row.corp_name as string,
    stock_code: row.stock_code as string,
    year: row.year as number,
    directors: row.directors as { name: string; position: string }[],
    cached_at: String(row.cached_at),
  }));
}

export async function deleteCacheEntries(ids: number[]): Promise<number> {
  if (ids.length === 0) return 0;
  await ensureTable();
  const sql = getSQL();
  const rows = await sql`
    DELETE FROM board_cache
    WHERE id = ANY(${ids})
  `;
  return rows.length;
}

export async function deleteAllCache(): Promise<number> {
  await ensureTable();
  const sql = getSQL();
  const rows = await sql`DELETE FROM board_cache`;
  return rows.length;
}
