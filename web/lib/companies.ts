import { put, list, del } from "@vercel/blob";
import seedData from "@/data/companies-seed.json";

export interface CompanyMap {
  [name: string]: string; // name -> stockCode
}

const BLOB_FILENAME = "companies.json";

async function isVercelBlobConfigured(): Promise<boolean> {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function getCompanies(): Promise<CompanyMap> {
  // If Vercel Blob is configured, read from there
  if (await isVercelBlobConfigured()) {
    try {
      const { blobs } = await list({ prefix: BLOB_FILENAME });
      if (blobs.length > 0) {
        const res = await fetch(blobs[0].url);
        return (await res.json()) as CompanyMap;
      }
    } catch {
      // Fall through to seed data
    }
  }

  // Fallback: use seed data from local JSON
  return seedData as CompanyMap;
}

export async function saveCompanies(companies: CompanyMap): Promise<void> {
  if (!(await isVercelBlobConfigured())) {
    throw new Error("Blob storage not configured");
  }

  // Delete existing blob if any
  try {
    const { blobs } = await list({ prefix: BLOB_FILENAME });
    for (const blob of blobs) {
      await del(blob.url);
    }
  } catch {
    // Ignore delete errors
  }

  // Upload new data
  await put(BLOB_FILENAME, JSON.stringify(companies, null, 2), {
    access: "public",
    contentType: "application/json",
  });
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
