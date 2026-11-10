import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { useTempRuntime } from "./helpers.ts";
import {
  getCachedResult,
  saveCacheResult,
  getCacheList,
  deleteCacheEntries,
  deleteAllCache,
} from "../lib/db.ts";

const directors = [
  { name: "유영상", position: "대표이사" },
  { name: "김용학", position: "사외이사" },
];

beforeEach(() => {
  useTempRuntime();
});

test("save 후 get이 같은 directors를 돌려준다", async () => {
  await saveCacheResult("SK텔레콤", "017670", 2024, directors);
  const got = await getCachedResult("017670", 2024);
  assert.ok(got);
  assert.deepEqual(got.directors, directors);
  assert.equal(got.corp_name, "SK텔레콤");
});

test("같은 stockCode·year로 다시 save하면 덮어쓴다(list 길이 1)", async () => {
  await saveCacheResult("SK텔레콤", "017670", 2024, directors);
  await saveCacheResult("SK텔레콤", "017670", 2024, [directors[0]]);
  const list = await getCacheList();
  assert.equal(list.length, 1);
  assert.deepEqual(list[0].directors, [directors[0]]);
});

test("deleteCacheEntries([id])가 1을 돌려주고 get이 null", async () => {
  await saveCacheResult("SK텔레콤", "017670", 2024, directors);
  const [entry] = await getCacheList();
  assert.equal(await deleteCacheEntries([entry.id]), 1);
  assert.equal(await getCachedResult("017670", 2024), null);
});

test("deleteAllCache가 삭제 건수를 돌려준다", async () => {
  await saveCacheResult("SK텔레콤", "017670", 2023, directors);
  await saveCacheResult("SK텔레콤", "017670", 2024, directors);
  assert.equal(await deleteAllCache(), 2);
  assert.equal((await getCacheList()).length, 0);
});
