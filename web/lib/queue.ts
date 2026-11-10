// 서버와 Claude Code 세션이 파일로 요청·결과를 주고받는 큐
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { getRuntimeDir } from "./runtime.ts";

export type Director = { name: string; position: string };

export type QueueRequest = {
  corpName: string;
  stockCode: string;
  year: number;
  sectionText: string;
};

export type QueueResult = { directors: Director[] } | { error: string };

export const TIMEOUT_ERROR = "Claude Code 응답 시간이 초과되었습니다.";

function queueDir(kind: "pending" | "done"): string {
  const dir = path.join(getRuntimeDir(), "queue", kind);
  mkdirSync(dir, { recursive: true });
  return dir;
}

// 감시 스크립트가 주기적으로 갱신하는 하트비트로 세션이 대기 중인지 판단한다
export function isWorkerAlive(now = Date.now(), maxAgeMs = 60_000): boolean {
  const file = path.join(getRuntimeDir(), "heartbeat");
  if (!existsSync(file)) return false;
  return now - statSync(file).mtimeMs <= maxAgeMs;
}

export function enqueueRequest(req: QueueRequest): string {
  const id = `${req.stockCode}-${req.year}-${Date.now()}-${randomBytes(2).toString("hex")}`;
  const dir = queueDir("pending");
  const tmp = path.join(dir, `.${id}.tmp`);
  // 감시 스크립트가 반쯤 쓴 파일을 보지 않도록 임시 파일에 쓴 뒤 이름을 바꾼다
  writeFileSync(tmp, JSON.stringify({ id, ...req, createdAt: new Date().toISOString() }, null, 2), "utf-8");
  renameSync(tmp, path.join(dir, `${id}.json`));
  return id;
}

function readResult(file: string): QueueResult | null {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf-8")) as QueueResult;
  } catch {
    return null; // 쓰는 중인 파일은 다음 폴링에서 다시 읽는다
  }
}

export async function waitForResult(
  id: string,
  opts: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<QueueResult> {
  const { timeoutMs = 300_000, intervalMs = 1000 } = opts;
  const pending = path.join(queueDir("pending"), `${id}.json`);
  const done = path.join(queueDir("done"), `${id}.json`);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = readResult(done);
    if (result) {
      rmSync(pending, { force: true });
      rmSync(done, { force: true });
      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  rmSync(pending, { force: true });
  return { error: TIMEOUT_ERROR };
}
