import JSZip from "jszip";

const DART_API_BASE = "https://opendart.fss.or.kr/api";

interface ReportInfo {
  rcept_no: string;
  report_nm: string;
  year: number;
}

// Cache corp_code lookups to avoid repeated API calls
const corpCodeCache = new Map<string, string>();

export async function getCorpCode(stockCode: string): Promise<string | null> {
  if (corpCodeCache.has(stockCode)) {
    return corpCodeCache.get(stockCode)!;
  }

  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) throw new Error("DART_API_KEY not configured");

  // Use list API with stock_code and short date range to extract corp_code
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10).replace(/-/g, "");
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const startDate = threeMonthsAgo.toISOString().slice(0, 10).replace(/-/g, "");

  const url = new URL(`${DART_API_BASE}/list.json`);
  url.searchParams.set("crtfc_key", apiKey);
  url.searchParams.set("stock_code", stockCode);
  url.searchParams.set("bgn_de", startDate);
  url.searchParams.set("end_de", endDate);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== "000" || !data.list || data.list.length === 0)
    return null;

  const corpCode = data.list[0].corp_code;
  corpCodeCache.set(stockCode, corpCode);
  return corpCode;
}

export async function getReportList(
  corpCode: string,
  year: number
): Promise<ReportInfo | null> {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) throw new Error("DART_API_KEY not configured");

  const url = new URL(`${DART_API_BASE}/list.json`);
  url.searchParams.set("crtfc_key", apiKey);
  url.searchParams.set("corp_code", corpCode);
  url.searchParams.set("bgn_de", `${year}0101`);
  url.searchParams.set("end_de", `${year}1231`);
  url.searchParams.set("pblntf_ty", "A");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`DART API error: ${res.status}`);

  const data = await res.json();
  if (data.status !== "000" || !data.list) return null;

  // 반기보고서 패턴 매칭 (당해년도 이사현황)
  const pattern = new RegExp(`반기보고서 \\(${year}\\.06\\)`);
  const matches = data.list.filter((item: { report_nm: string }) =>
    pattern.test(item.report_nm)
  );

  if (matches.length === 0) return null;

  return {
    rcept_no: matches[0].rcept_no,
    report_nm: matches[0].report_nm,
    year,
  };
}

export async function getReportHtml(rceptNo: string): Promise<string> {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) throw new Error("DART_API_KEY not configured");

  const url = new URL(`${DART_API_BASE}/document.xml`);
  url.searchParams.set("crtfc_key", apiKey);
  url.searchParams.set("rcept_no", rceptNo);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`DART document API error: ${res.status}`);

  // DART document.xml returns a ZIP file containing HTML/XML documents
  const buffer = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  // Find the main XML/HTML file (largest one)
  let mainRaw: Uint8Array | null = null;
  let maxSize = 0;

  for (const [filename, file] of Object.entries(zip.files)) {
    if (file.dir) continue;
    if (filename.endsWith(".xml") || filename.endsWith(".html")) {
      const raw = await file.async("uint8array");
      if (raw.length > maxSize) {
        maxSize = raw.length;
        mainRaw = raw;
      }
    }
  }

  if (!mainRaw) {
    for (const [, file] of Object.entries(zip.files)) {
      if (!file.dir) {
        mainRaw = await file.async("uint8array");
        break;
      }
    }
  }

  if (!mainRaw) return "";

  // DART 문서는 XML 선언에 utf-8이라고 적혀있어도 실제로는 EUC-KR인 경우가 많음
  // UTF-8로 먼저 디코딩하고, 한글이 정상적으로 포함되어 있는지 확인
  const utf8Text = new TextDecoder("utf-8", { fatal: false }).decode(mainRaw);

  // UTF-8 디코딩 결과에 한글이 정상적으로 포함되어 있으면 사용
  if (/[가-힣]{3,}/.test(utf8Text)) {
    return utf8Text;
  }

  // 한글이 없으면 EUC-KR로 재디코딩
  const eucKrText = new TextDecoder("euc-kr", { fatal: false }).decode(mainRaw);
  return eucKrText;
}
