import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getRuntimeDir } from "./runtime.ts";

export interface CompanyMap {
  [name: string]: string; // name -> stockCode
}

function companiesFile(): string {
  return path.join(getRuntimeDir(), "companies.json");
}

export async function getCompanies(): Promise<CompanyMap> {
  const file = companiesFile();
  // 관리자 페이지에서 바꾼 목록이 없으면 저장소의 기본 목록을 쓴다
  const source = existsSync(file)
    ? file
    : path.join(process.cwd(), "data", "companies-seed.json");
  return JSON.parse(readFileSync(source, "utf-8")) as CompanyMap;
}

export async function saveCompanies(companies: CompanyMap): Promise<void> {
  writeFileSync(companiesFile(), JSON.stringify(companies, null, 2), "utf-8");
}

export async function addCompany(
  name: string,
  stockCode: string
): Promise<CompanyMap> {
  const companies = await getCompanies();
  companies[name] = stockCode;
  await saveCompanies(companies);
  return companies;
}

export async function deleteCompany(name: string): Promise<CompanyMap> {
  const companies = await getCompanies();
  delete companies[name];
  await saveCompanies(companies);
  return companies;
}
