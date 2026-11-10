import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCorpCode, getReportList, getReportHtml } from "@/lib/dart";
import { extractBoardSection } from "@/lib/parser";
import { parseDirectors } from "@/lib/llm";
import { getCachedResult, saveCacheResult } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { corpName, stockCode, year } = body;

    if (!corpName || !stockCode || !year) {
      return NextResponse.json(
        { error: "corpName, stockCode, year are required" },
        { status: 400 }
      );
    }

    // 0. Check cache first
    try {
      const cached = await getCachedResult(stockCode, year);
      if (cached) {
        return NextResponse.json({
          corpName,
          year,
          directors: cached.directors,
          cached: true,
        });
      }
    } catch (error) {
      console.error("Cache read error (proceeding without cache):", error);
    }

    // 1. Get corp_code from stock_code
    const corpCode = await getCorpCode(stockCode);
    if (!corpCode) {
      return NextResponse.json(
        {
          error: `${corpName}의 기업고유번호를 찾을 수 없습니다.`,
          corpName,
          year,
          directors: [],
        },
        { status: 200 }
      );
    }

    // 2. Get report list for this year
    const report = await getReportList(corpCode, year);
    if (!report) {
      return NextResponse.json(
        {
          corpName,
          year,
          directors: [],
          message: `${year}년 이사회 구성 정보를 찾을 수 없습니다.`,
        },
        { status: 200 }
      );
    }

    // 3. Get report HTML
    const html = await getReportHtml(report.rcept_no);

    // 4. Extract board section
    const sectionText = extractBoardSection(html);

    // 5. Parse with LLM
    const result = await parseDirectors(sectionText, corpName, year);

    // 6. Save to cache (best-effort)
    try {
      await saveCacheResult(corpName, stockCode, year, result.directors);
    } catch (error) {
      console.error("Cache save error (result still returned):", error);
    }

    return NextResponse.json({
      corpName,
      year,
      directors: result.directors,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
