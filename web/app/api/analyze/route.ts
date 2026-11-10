import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCorpCode, getReportList, getReportHtml } from "@/lib/dart";
import { extractBoardSection } from "@/lib/parser";
import { getCachedResult, saveCacheResult } from "@/lib/db";
import { isWorkerAlive, enqueueRequest, waitForResult } from "@/lib/queue";

const WORKER_OFFLINE_ERROR =
  "Claude Code 세션에서 '보드트래커 시작'을 먼저 실행하세요.";

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

    // 0. 캐시 우선
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

    // 1. Claude Code 세션이 대기 중이 아니면 DART 호출 전에 바로 알린다
    if (!isWorkerAlive()) {
      return NextResponse.json(
        { corpName, year, directors: [], error: WORKER_OFFLINE_ERROR },
        { status: 503 }
      );
    }

    // 2. 종목코드 → 기업고유번호
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

    // 3. 해당 연도 사업보고서
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

    // 4. 보고서에서 이사회 섹션 추출
    const html = await getReportHtml(report.rcept_no);
    const sectionText = extractBoardSection(html);
    if (!sectionText.trim()) {
      return NextResponse.json({
        corpName,
        year,
        directors: [],
        message: `${year}년 보고서에서 이사회 섹션을 찾을 수 없습니다.`,
      });
    }

    // 5. Claude Code 세션에 명단 추출을 맡기고 결과를 기다린다
    const id = enqueueRequest({ corpName, stockCode, year, sectionText });
    const result = await waitForResult(id);
    if ("error" in result) {
      return NextResponse.json({ corpName, year, directors: [], error: result.error });
    }

    // 6. 캐시 저장 (실패해도 결과는 돌려준다)
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
