import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import path from "node:path";
import { useTempRuntime } from "./helpers.ts";
import { isWorkerAlive, enqueueRequest, waitForResult } from "../lib/queue.ts";

const req = {
  corpName: "SK텔레콤",
  stockCode: "017670",
  year: 2024,
  sectionText: "이사회 구성: 사내이사 2인(유영상, 한명진)",
};

let runtimeDir = "";
beforeEach(() => {
  runtimeDir = useTempRuntime();
});

const pendingFile = (id: string) => path.join(runtimeDir, "queue", "pending", `${id}.json`);
const doneFile = (id: string) => path.join(runtimeDir, "queue", "done", `${id}.json`);

function writeDone(id: string, content: string) {
  mkdirSync(path.dirname(doneFile(id)), { recursive: true });
  writeFileSync(doneFile(id), content);
}

test("heartbeat 파일이 없으면 isWorkerAlive는 false", () => {
  assert.equal(isWorkerAlive(), false);
});

test("heartbeat를 방금 갱신하면 true, 120초 전이면 false", () => {
  const hb = path.join(runtimeDir, "heartbeat");
  writeFileSync(hb, "");
  assert.equal(isWorkerAlive(), true);
  const old = new Date(Date.now() - 120_000);
  utimesSync(hb, old, old);
  assert.equal(isWorkerAlive(), false);
});

test("enqueueRequest가 pending/<id>.json을 만들고 sectionText를 담는다", () => {
  const id = enqueueRequest(req);
  const saved = JSON.parse(readFileSync(pendingFile(id), "utf-8"));
  assert.equal(saved.id, id);
  assert.equal(saved.sectionText, req.sectionText);
  assert.equal(saved.year, 2024);
});

test("같은 회사·연도로 두 번 enqueue하면 id가 다르다", () => {
  assert.notEqual(enqueueRequest(req), enqueueRequest(req));
});

test("쓰는 도중의 깨진 JSON은 건너뛰고 완성된 결과를 돌려준다", async () => {
  const id = enqueueRequest(req);
  writeDone(id, '{"directors": [{"name": "유영');
  setTimeout(
    () => writeDone(id, JSON.stringify({ directors: [{ name: "유영상", position: "대표이사" }] })),
    50
  );
  const result = await waitForResult(id, { intervalMs: 20, timeoutMs: 2000 });
  assert.deepEqual(result, { directors: [{ name: "유영상", position: "대표이사" }] });
});

test("결과를 받으면 pending·done 파일이 모두 지워진다", async () => {
  const id = enqueueRequest(req);
  writeDone(id, JSON.stringify({ directors: [] }));
  await waitForResult(id, { intervalMs: 20, timeoutMs: 2000 });
  assert.equal(existsSync(pendingFile(id)), false);
  assert.equal(existsSync(doneFile(id)), false);
});

test("Claude가 쓴 error 결과를 그대로 돌려준다", async () => {
  const id = enqueueRequest(req);
  writeDone(id, JSON.stringify({ error: "명단을 찾을 수 없음" }));
  const result = await waitForResult(id, { intervalMs: 20, timeoutMs: 2000 });
  assert.deepEqual(result, { error: "명단을 찾을 수 없음" });
});

test("시간 안에 결과가 없으면 error를 돌려주고 pending 파일을 지운다", async () => {
  const id = enqueueRequest(req);
  const result = await waitForResult(id, { intervalMs: 20, timeoutMs: 100 });
  assert.ok("error" in result);
  assert.equal(existsSync(pendingFile(id)), false);
});
