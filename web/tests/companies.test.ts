import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { useTempRuntime } from "./helpers.ts";
import { getCompanies, addCompany, deleteCompany } from "../lib/companies.ts";

let runtimeDir = "";
beforeEach(() => {
  runtimeDir = useTempRuntime();
});

test("파일이 없으면 seed를 돌려준다", async () => {
  const companies = await getCompanies();
  assert.equal(companies["SK텔레콤"], "017670");
});

test("한글 회사명을 추가하면 companies.json에 그대로 남는다", async () => {
  await addCompany("한글테스트", "999999");
  const raw = readFileSync(path.join(runtimeDir, "companies.json"), "utf-8");
  assert.equal(JSON.parse(raw)["한글테스트"], "999999");
  assert.equal((await getCompanies())["한글테스트"], "999999");
});

test("deleteCompany 후 사라진다", async () => {
  await addCompany("한글테스트", "999999");
  await deleteCompany("한글테스트");
  assert.equal((await getCompanies())["한글테스트"], undefined);
});
