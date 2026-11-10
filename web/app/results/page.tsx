"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface Director {
  name: string;
  position: string;
}

interface AnalyzeResult {
  corpName: string;
  year: number;
  directors: Director[];
  message?: string;
  error?: string;
  cached?: boolean;
}

interface CompanyParam {
  name: string;
  stockCode: string;
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-[#F9F9FB]">
          <div className="text-center animate-pulse">
            <div className="w-8 h-8 border-2 border-[#4B6BFB] border-t-transparent rounded-full mx-auto mb-3 animate-spin" />
            <p className="text-[#8A8A9A] text-sm">로딩 중...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<AnalyzeResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const startedRef = useRef(false);

  const companiesParam = searchParams.get("companies");
  const startYear = Number(searchParams.get("startYear") || 2022);
  const endYear = Number(searchParams.get("endYear") || 2025);

  const companies: CompanyParam[] = companiesParam
    ? JSON.parse(companiesParam)
    : [];

  const processAll = useCallback(async () => {
    if (companies.length === 0) return;

    const tasks: { company: CompanyParam; year: number }[] = [];
    for (const company of companies) {
      for (let year = startYear; year <= endYear; year++) {
        tasks.push({ company, year });
      }
    }

    setProgress({ current: 0, total: tasks.length });
    setIsProcessing(true);
    setActiveTab(companies[0]?.name || "");

    for (let i = 0; i < tasks.length; i++) {
      const { company, year } = tasks[i];

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            corpName: company.name,
            stockCode: company.stockCode,
            year,
          }),
        });

        const data: AnalyzeResult = await res.json();
        setResults((prev) => [...prev, data]);
      } catch {
        setResults((prev) => [
          ...prev,
          {
            corpName: company.name,
            year,
            directors: [],
            error: "요청 실패",
          },
        ]);
      }

      setProgress({ current: i + 1, total: tasks.length });
    }

    setIsProcessing(false);
  }, [companies, startYear, endYear]);

  useEffect(() => {
    if (!startedRef.current && companies.length > 0) {
      startedRef.current = true;
      processAll();
    }
  }, [processAll, companies.length]);

  function downloadCSV() {
    const rows: string[][] = [
      ["회사명", "연도", "성명", "직위"],
    ];

    for (const result of results) {
      for (const d of result.directors) {
        rows.push([
          result.corpName,
          String(result.year),
          d.name,
          d.position,
        ]);
      }
    }

    const bom = "﻿";
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "board_status.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const resultsByCompany = results.reduce<Record<string, AnalyzeResult[]>>(
    (acc, r) => {
      if (!acc[r.corpName]) acc[r.corpName] = [];
      acc[r.corpName].push(r);
      return acc;
    },
    {}
  );

  const companyNames = companies.map((c) => c.name);

  return (
    <div className="flex-1 bg-[#F9F9FB] py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] md:text-2xl text-xl">조회 결과</h1>
            <p className="text-[#8A8A9A] text-sm mt-1">
              {startYear}년 ~ {endYear}년 | {companies.length}개 회사
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="px-4 py-2 text-[#8A8A9A] bg-white border border-[#ECECEC] rounded-xl hover:bg-[#F9F9FB] transition text-sm min-h-[44px] flex items-center"
            >
              다시 선택
            </a>
            <button
              onClick={downloadCSV}
              disabled={results.length === 0}
              className="px-4 py-2 bg-[#4B6BFB] text-white rounded-xl hover:bg-[#3A5AEA] disabled:opacity-50 transition text-sm min-h-[44px] shadow-[0_2px_8px_rgba(75,107,251,0.3)]"
            >
              CSV 다운로드
            </button>
          </div>
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECECEC] p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#8A8A9A]">
                {progress.current}/{progress.total} 처리 중...
              </span>
              <span className="text-sm font-medium text-[#4B6BFB]">
                {Math.round((progress.current / progress.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-[#F3F3F6] rounded-full h-1.5">
              <div
                className="bg-[#4B6BFB] h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Results Tabs */}
        {companyNames.length > 0 && (
          <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECECEC] overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-[#ECECEC] overflow-x-auto">
              {companyNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setActiveTab(name)}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition min-h-[44px] ${
                    activeTab === name
                      ? "text-[#4B6BFB] border-b-2 border-[#4B6BFB] bg-[#EEF1FF]/40"
                      : "text-[#8A8A9A] hover:text-[#1A1A1A] hover:bg-[#F3F3F6]"
                  }`}
                >
                  {name}
                  {resultsByCompany[name] && (
                    <span className="ml-1 text-xs text-[#8A8A9A]">
                      ({resultsByCompany[name].length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {resultsByCompany[activeTab] ? (
                resultsByCompany[activeTab]
                  .sort((a, b) => a.year - b.year)
                  .map((result) => (
                    <div key={`${result.corpName}-${result.year}`} className="mb-6 last:mb-0">
                      <h3 className="text-base font-semibold text-[#1A1A1A] mb-3">
                        {result.year}년
                        {result.error && (
                          <span className="ml-2 text-sm text-red-500 font-normal">
                            {result.error}
                          </span>
                        )}
                        {result.message && (
                          <span className="ml-2 text-sm text-amber-500 font-normal">
                            {result.message}
                          </span>
                        )}
                      </h3>
                      {result.directors.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-[#F3F3F6]">
                                <th className="text-left px-4 py-2.5 text-[#8A8A9A] font-medium border-b border-[#ECECEC]">
                                  성명
                                </th>
                                <th className="text-left px-4 py-2.5 text-[#8A8A9A] font-medium border-b border-[#ECECEC]">
                                  직위
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.directors.map((d, i) => (
                                <tr
                                  key={i}
                                  className="border-t border-[#ECECEC] hover:bg-[#F9F9FB] transition"
                                >
                                  <td className="px-4 py-2.5 text-[#1A1A1A] font-medium">
                                    {d.name}
                                  </td>
                                  <td className="px-4 py-2.5 text-[#8A8A9A]">
                                    {d.position}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        !result.error &&
                        !result.message && (
                          <p className="text-[#8A8A9A] text-sm">
                            이사회 정보를 찾을 수 없습니다.
                          </p>
                        )
                      )}
                    </div>
                  ))
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-[#4B6BFB] border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-[#8A8A9A] text-sm">처리 중...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
