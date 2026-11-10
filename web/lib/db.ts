import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { getRuntimeDir } from "./runtime.ts";

export interface CacheEntry {
  id: number;
  corp_name: string;
  stock_code: string;
  year: number;
  directors: { name: string; position: string }[];
  cached_at: string;
}

interface CacheRow {
  id: number;
  corp_name: string;
  stock_code: string;
  year: number;
  directors: string;
  cached_at: string;
}

// 런타임 폴더별로 연결을 하나씩 유지한다 (테스트에서 폴더가 바뀔 수 있음)
const connections = new Map<string, DatabaseSync>();

function getDb(): DatabaseSync {
  const file = path.join(getRuntimeDir(), "cache.db");
  let db = connections.get(file);
  if (!db) {
    db = new DatabaseSync(file);
    db.exec(`
      CREATE TABLE IF NOT EXISTS board_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        corp_name TEXT NOT NULL,
        stock_code TEXT NOT NULL,
        year INTEGER NOT NULL,
        directors TEXT NOT NULL,
        cached_at TEXT NOT NULL,
        UNIQUE(stock_code, year)
      )
    `);
    connections.set(file, db);
  }
  return db;
}

function toEntry(row: CacheRow): CacheEntry {
  return { ...row, directors: JSON.parse(row.directors) };
}

export async function getCachedResult(
  stockCode: string,
  year: number
): Promise<CacheEntry | null> {
  const row = getDb()
    .prepare(
      "SELECT id, corp_name, stock_code, year, directors, cached_at FROM board_cache WHERE stock_code = ? AND year = ?"
    )
    .get(stockCode, year) as CacheRow | undefined;
  return row ? toEntry(row) : null;
}

export async function saveCacheResult(
  corpName: string,
  stockCode: string,
  year: number,
  directors: { name: string; position: string }[]
): Promise<void> {
  getDb()
    .prepare(
      `INSERT INTO board_cache (corp_name, stock_code, year, directors, cached_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (stock_code, year) DO UPDATE SET
         corp_name = excluded.corp_name,
         directors = excluded.directors,
         cached_at = excluded.cached_at`
    )
    .run(corpName, stockCode, year, JSON.stringify(directors), new Date().toISOString());
}

export async function getCacheList(): Promise<CacheEntry[]> {
  const rows = getDb()
    .prepare(
      "SELECT id, corp_name, stock_code, year, directors, cached_at FROM board_cache ORDER BY corp_name ASC, year DESC"
    )
    .all() as unknown as CacheRow[];
  return rows.map(toEntry);
}

export async function deleteCacheEntries(ids: number[]): Promise<number> {
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => "?").join(", ");
  const result = getDb()
    .prepare(`DELETE FROM board_cache WHERE id IN (${placeholders})`)
    .run(...ids);
  return Number(result.changes);
}

export async function deleteAllCache(): Promise<number> {
  return Number(getDb().prepare("DELETE FROM board_cache").run().changes);
}
