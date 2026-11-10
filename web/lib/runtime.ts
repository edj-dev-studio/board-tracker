import { mkdirSync } from "node:fs";
import path from "node:path";

// 큐·하트비트·캐시 DB·회사 목록이 놓이는 로컬 런타임 폴더 (git 제외)
export function getRuntimeDir(): string {
  const dir =
    process.env.BOARD_TRACKER_RUNTIME_DIR ??
    path.join(process.cwd(), ".runtime");
  mkdirSync(dir, { recursive: true });
  return dir;
}
