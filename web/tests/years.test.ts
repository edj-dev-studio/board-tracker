import { test } from "node:test";
import assert from "node:assert/strict";
import { recentYearRange } from "../lib/years.ts";

test("2026년에는 기본 조회 범위가 2023~2026이다", () => {
  assert.deepEqual(recentYearRange(new Date("2026-11-10")), { startYear: 2023, endYear: 2026 });
});

test("해가 바뀌면 범위도 따라 움직인다", () => {
  assert.deepEqual(recentYearRange(new Date("2027-01-02")), { startYear: 2024, endYear: 2027 });
});
