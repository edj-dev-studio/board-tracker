// 테스트마다 격리된 런타임 폴더를 만든다
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export function useTempRuntime(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "bt-runtime-"));
  process.env.BOARD_TRACKER_RUNTIME_DIR = dir;
  return dir;
}
